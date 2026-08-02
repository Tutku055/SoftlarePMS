using System.Text.Encodings.Web;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Diagnostics;
using SoftPMS.Application.Common.Interfaces;
using SoftPMS.Domain.Entities;

namespace SoftPMS.Persistence.Interceptors;

/// <summary>
/// Enterprise-grade, anti-bloat EF Core SaveChangesInterceptor.
/// Implements delta-only change tracking, transaction-level correlation ID tracing,
/// post-save database-generated primary key resolution, and infrastructure-level exclusions.
/// All exclusion policies reside strictly within the Persistence layer to keep Domain POCOs 100% pure.
/// </summary>
public sealed class AuditSaveChangesInterceptor(ICurrentUserService currentUser) : SaveChangesInterceptor
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        WriteIndented = false,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
        ReferenceHandler = ReferenceHandler.IgnoreCycles,
        Encoder = JavaScriptEncoder.UnsafeRelaxedJsonEscaping
    };

    /// <summary>
    /// Persistence-level technical table and entity type bypass list.
    /// Eliminates the need for domain attributes or hardcoded entity class checks.
    /// </summary>
    private static readonly HashSet<string> IgnoredTableAndEntityNames = new(StringComparer.OrdinalIgnoreCase)
    {
        nameof(AuditLog),
        "AuditLogs",
        "RefreshToken",
        "RefreshTokens",
        "SystemLog",
        "SystemLogs",
        "PersistedGrant",
        "PersistedGrants",
        "DeviceFlowCode",
        "DeviceFlowCodes",
        "Key",
        "Keys"
    };

    /// <summary>
    /// Persistence-level sensitive or transient property bypass list.
    /// Prevents secrets, tokens, and security metadata from being logged into the audit trail.
    /// </summary>
    private static readonly HashSet<string> IgnoredPropertyNames = new(StringComparer.OrdinalIgnoreCase)
    {
        "PasswordHash",
        "RefreshToken",
        "RefreshTokenExpiryTime",
        "SecurityStamp",
        "ConcurrencyStamp"
    };

    // Staging collection for Added entities with temporary / store-generated primary keys
    private readonly List<AuditEntry> _pendingTemporaryAuditEntries = [];

    public override ValueTask<InterceptionResult<int>> SavingChangesAsync(
        DbContextEventData eventData,
        InterceptionResult<int> result,
        CancellationToken cancellationToken = default)
    {
        if (eventData.Context is not null)
        {
            ProcessSavingChanges(eventData.Context);
        }

        return base.SavingChangesAsync(eventData, result, cancellationToken);
    }

    public override InterceptionResult<int> SavingChanges(
        DbContextEventData eventData,
        InterceptionResult<int> result)
    {
        if (eventData.Context is not null)
        {
            ProcessSavingChanges(eventData.Context);
        }

        return base.SavingChanges(eventData, result);
    }

    public override async ValueTask<int> SavedChangesAsync(
        SaveChangesCompletedEventData eventData,
        int result,
        CancellationToken cancellationToken = default)
    {
        if (eventData.Context is not null && _pendingTemporaryAuditEntries.Count > 0)
        {
            await ProcessSavedChangesAsync(eventData.Context, cancellationToken);
        }

        return await base.SavedChangesAsync(eventData, result, cancellationToken);
    }

    public override int SavedChanges(
        SaveChangesCompletedEventData eventData,
        int result)
    {
        if (eventData.Context is not null && _pendingTemporaryAuditEntries.Count > 0)
        {
            ProcessSavedChanges(eventData.Context);
        }

        return base.SavedChanges(eventData, result);
    }

    public override void SaveChangesFailed(DbContextErrorEventData eventData)
    {
        _pendingTemporaryAuditEntries.Clear();
        base.SaveChangesFailed(eventData);
    }

    public override Task SaveChangesFailedAsync(
        DbContextErrorEventData eventData,
        CancellationToken cancellationToken = default)
    {
        _pendingTemporaryAuditEntries.Clear();
        return base.SaveChangesFailedAsync(eventData, cancellationToken);
    }

    private void ProcessSavingChanges(DbContext context)
    {
        _pendingTemporaryAuditEntries.Clear();

        var entries = context.ChangeTracker
            .Entries()
            .Where(e => !ShouldIgnoreEntity(e) &&
                        e.State is EntityState.Added or EntityState.Modified or EntityState.Deleted)
            .ToList();

        if (entries.Count == 0)
            return;

        // Single transaction CorrelationId linking all modifications within this execution
        var correlationId = Guid.NewGuid();
        var changedAt = DateTime.UtcNow;

        var changedByEmail = currentUser.IsAuthenticated && !string.IsNullOrWhiteSpace(currentUser.UserEmail)
            ? currentUser.UserEmail
            : "System";

        var changedByUserId = currentUser.IsAuthenticated && currentUser.UserId != Guid.Empty
            ? currentUser.UserId.ToString()
            : null;

        var readyAuditLogs = new List<AuditLog>();

        foreach (var entry in entries)
        {
            var auditEntry = new AuditEntry(entry)
            {
                CorrelationId = correlationId,
                TableName = entry.Metadata.GetTableName() ?? entry.Metadata.ClrType.Name,
                ChangedByUserId = changedByUserId,
                ChangedByEmail = changedByEmail,
                ChangedAt = changedAt
            };

            switch (entry.State)
            {
                case EntityState.Added:
                    auditEntry.Action = "Created";
                    foreach (var property in entry.Properties)
                    {
                        if (ShouldIgnoreProperty(property))
                            continue;

                        var propName = property.Metadata.Name;

                        if (property.Metadata.IsPrimaryKey())
                        {
                            if (property.IsTemporary || IsDefaultOrZeroValue(property.CurrentValue, property.Metadata.ClrType))
                            {
                                auditEntry.TemporaryProperties.Add(property);
                            }
                            else
                            {
                                auditEntry.KeyValues[propName] = property.CurrentValue;
                            }
                        }

                        auditEntry.NewValues[propName] = property.CurrentValue;
                    }
                    break;

                case EntityState.Deleted:
                    auditEntry.Action = "Deleted";
                    foreach (var property in entry.Properties)
                    {
                        if (ShouldIgnoreProperty(property))
                            continue;

                        var propName = property.Metadata.Name;

                        if (property.Metadata.IsPrimaryKey())
                        {
                            auditEntry.KeyValues[propName] = property.OriginalValue;
                        }

                        auditEntry.OldValues[propName] = property.OriginalValue;
                    }
                    break;

                case EntityState.Modified:
                    auditEntry.Action = "Modified";
                    foreach (var property in entry.Properties)
                    {
                        if (ShouldIgnoreProperty(property))
                            continue;

                        var propName = property.Metadata.Name;

                        if (property.Metadata.IsPrimaryKey())
                        {
                            auditEntry.KeyValues[propName] = property.CurrentValue ?? property.OriginalValue;
                        }

                        // Delta Logging (Anti-Bloat): Only capture properties whose values actually changed
                        if (property.IsModified)
                        {
                            var originalVal = property.OriginalValue;
                            var currentVal = property.CurrentValue;

                            if (!Equals(originalVal, currentVal))
                            {
                                auditEntry.OldValues[propName] = originalVal;
                                auditEntry.NewValues[propName] = currentVal;
                            }
                        }
                    }

                    // Anti-bloat check: If no auditable properties actually changed value, skip logging this entry
                    if (auditEntry.OldValues.Count == 0 && auditEntry.NewValues.Count == 0)
                    {
                        continue;
                    }
                    break;
            }

            if (auditEntry.HasTemporaryProperties)
            {
                _pendingTemporaryAuditEntries.Add(auditEntry);
            }
            else
            {
                readyAuditLogs.Add(auditEntry.ToAuditLog());
            }
        }

        if (readyAuditLogs.Count > 0)
        {
            context.Set<AuditLog>().AddRange(readyAuditLogs);
        }
    }

    private async Task ProcessSavedChangesAsync(DbContext context, CancellationToken cancellationToken)
    {
        if (_pendingTemporaryAuditEntries.Count == 0)
            return;

        var temporaryLogs = new List<AuditLog>(_pendingTemporaryAuditEntries.Count);

        foreach (var auditEntry in _pendingTemporaryAuditEntries)
        {
            foreach (var prop in auditEntry.TemporaryProperties)
            {
                var propName = prop.Metadata.Name;
                var generatedVal = prop.CurrentValue;

                auditEntry.KeyValues[propName] = generatedVal;
                auditEntry.NewValues[propName] = generatedVal;
            }

            temporaryLogs.Add(auditEntry.ToAuditLog());
        }

        _pendingTemporaryAuditEntries.Clear();

        if (temporaryLogs.Count > 0)
        {
            context.Set<AuditLog>().AddRange(temporaryLogs);
            await context.SaveChangesAsync(cancellationToken);
        }
    }

    private void ProcessSavedChanges(DbContext context)
    {
        if (_pendingTemporaryAuditEntries.Count == 0)
            return;

        var temporaryLogs = new List<AuditLog>(_pendingTemporaryAuditEntries.Count);

        foreach (var auditEntry in _pendingTemporaryAuditEntries)
        {
            foreach (var prop in auditEntry.TemporaryProperties)
            {
                var propName = prop.Metadata.Name;
                var generatedVal = prop.CurrentValue;

                auditEntry.KeyValues[propName] = generatedVal;
                auditEntry.NewValues[propName] = generatedVal;
            }

            temporaryLogs.Add(auditEntry.ToAuditLog());
        }

        _pendingTemporaryAuditEntries.Clear();

        if (temporaryLogs.Count > 0)
        {
            context.Set<AuditLog>().AddRange(temporaryLogs);
            context.SaveChanges();
        }
    }

    /// <summary>
    /// Evaluates whether the entity type should be excluded from audit logging
    /// using pure Persistence-level metadata and configuration.
    /// </summary>
    private static bool ShouldIgnoreEntity(EntityEntry entry)
    {
        var clrType = entry.Metadata.ClrType;
        if (clrType == null)
            return true;

        // 1. Never audit AuditLog itself to prevent infinite recursion
        if (clrType == typeof(AuditLog) || typeof(AuditLog).IsAssignableFrom(clrType))
            return true;

        // 2. Pure Persistence-level check by table name or entity type name
        var tableName = entry.Metadata.GetTableName();
        if (!string.IsNullOrEmpty(tableName) && IgnoredTableAndEntityNames.Contains(tableName))
            return true;

        if (IgnoredTableAndEntityNames.Contains(clrType.Name))
            return true;

        return false;
    }

    /// <summary>
    /// Evaluates whether a scalar property should be excluded from audit logging.
    /// Excludes EF Core shadow properties and configured sensitive/technical property names.
    /// </summary>
    private static bool ShouldIgnoreProperty(PropertyEntry property)
    {
        // Skip EF Core internal shadow properties (not part of domain model)
        if (property.Metadata.IsShadowProperty())
            return true;

        // Skip sensitive / ignored properties by name
        if (IgnoredPropertyNames.Contains(property.Metadata.Name))
            return true;

        return false;
    }

    private static bool IsDefaultOrZeroValue(object? value, Type type)
    {
        if (value is null)
            return true;

        if (type == typeof(int) && value is int intVal)
            return intVal == 0;

        if (type == typeof(long) && value is long longVal)
            return longVal == 0L;

        if (type == typeof(Guid) && value is Guid guidVal)
            return guidVal == Guid.Empty;

        return false;
    }

    /// <summary>
    /// Internal staging model representing an audit record prior to final serialization and persistence.
    /// </summary>
    private sealed class AuditEntry(EntityEntry entry)
    {
        public EntityEntry Entry { get; } = entry;
        public Guid CorrelationId { get; set; }
        public string TableName { get; set; } = string.Empty;
        public string Action { get; set; } = string.Empty;
        public string? ChangedByUserId { get; set; }
        public string ChangedByEmail { get; set; } = string.Empty;
        public DateTime ChangedAt { get; set; }

        public Dictionary<string, object?> KeyValues { get; } = new();
        public Dictionary<string, object?> OldValues { get; } = new();
        public Dictionary<string, object?> NewValues { get; } = new();
        public List<PropertyEntry> TemporaryProperties { get; } = [];

        public bool HasTemporaryProperties => TemporaryProperties.Count > 0;

        public AuditLog ToAuditLog()
        {
            return new AuditLog
            {
                CorrelationId = CorrelationId,
                TableName = TableName,
                RecordId = KeyValues.Count switch
                {
                    0 => "0",
                    1 => KeyValues.Values.First()?.ToString() ?? "0",
                    _ => string.Join(",", KeyValues.Select(kv => $"{kv.Key}={kv.Value}"))
                },
                Action = Action,
                OldValues = OldValues.Count == 0 ? null : JsonSerializer.Serialize(OldValues, JsonOptions),
                NewValues = NewValues.Count == 0 ? null : JsonSerializer.Serialize(NewValues, JsonOptions),
                ChangedByUserId = ChangedByUserId,
                ChangedByEmail = ChangedByEmail,
                ChangedAt = ChangedAt
            };
        }
    }
}
