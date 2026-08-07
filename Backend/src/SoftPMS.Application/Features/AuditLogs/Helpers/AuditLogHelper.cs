using System.Linq.Expressions;
using System.Reflection;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata;
using SoftPMS.Application.Common.Interfaces;
using SoftPMS.Application.Features.AuditLogs.DTOs;

namespace SoftPMS.Application.Features.AuditLogs.Helpers;

public static class AuditLogHelper
{
    /// <summary>
    /// Finds the EF Core entity type metadata by table name or CLR type name.
    /// </summary>
    public static IEntityType? FindEntityType(DbContext dbContext, string tableName)
    {
        if (string.IsNullOrWhiteSpace(tableName))
            return null;

        return dbContext.Model.GetEntityTypes().FirstOrDefault(t =>
            string.Equals(t.GetTableName(), tableName, StringComparison.OrdinalIgnoreCase) ||
            string.Equals(t.ClrType.Name, tableName, StringComparison.OrdinalIgnoreCase) ||
            string.Equals(t.ClrType.Name + "s", tableName, StringComparison.OrdinalIgnoreCase) ||
            string.Equals(t.ClrType.Name + "es", tableName, StringComparison.OrdinalIgnoreCase));
    }

    /// <summary>
    /// Dynamically determines if an entity identified by TableName and RecordId exists in the database.
    /// Supports both single primary keys and composite primary keys (e.g. RolePermissions),
    /// and checks soft-deletion if applicable.
    /// </summary>
    public static async Task<bool> CheckEntityExistsAsync(
        DbContext dbContext,
        string tableName,
        string recordId,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(tableName) || string.IsNullOrWhiteSpace(recordId) || recordId == "0")
            return false;

        try
        {
            // 1. Locate entity type in EF Core metadata
            var entityType = FindEntityType(dbContext, tableName);
            if (entityType == null)
                return false;

            var primaryKey = entityType.FindPrimaryKey();
            if (primaryKey == null || primaryKey.Properties.Count == 0)
                return false;

            var clrType = entityType.ClrType;
            var parameter = Expression.Parameter(clrType, "e");
            Expression? pkPredicate = null;

            // 2. Handle Single Primary Key vs Composite Primary Key
            if (primaryKey.Properties.Count == 1)
            {
                var pkProp = primaryKey.Properties[0];
                var pkClrPropInfo = pkProp.PropertyInfo ?? clrType.GetProperty(pkProp.Name);
                if (pkClrPropInfo == null)
                    return false;

                var convertedKey = ConvertValue(recordId, pkProp.ClrType);
                if (convertedKey == null)
                    return false;

                var propertyAccess = Expression.Property(parameter, pkClrPropInfo);
                var constant = Expression.Constant(convertedKey, pkProp.ClrType);
                pkPredicate = Expression.Equal(propertyAccess, constant);
            }
            else
            {
                // Composite key support (e.g., "RoleId=1,PermissionId=2" or "1,2")
                var pkValues = ParseCompositeKeyValues(recordId, primaryKey.Properties);
                if (pkValues == null || pkValues.Count != primaryKey.Properties.Count)
                    return false;

                foreach (var pkProp in primaryKey.Properties)
                {
                    if (!pkValues.TryGetValue(pkProp.Name, out var convertedKey) || convertedKey == null)
                        return false;

                    var pkClrPropInfo = pkProp.PropertyInfo ?? clrType.GetProperty(pkProp.Name);
                    if (pkClrPropInfo == null)
                        return false;

                    var propertyAccess = Expression.Property(parameter, pkClrPropInfo);
                    var constant = Expression.Constant(convertedKey, pkProp.ClrType);
                    var equality = Expression.Equal(propertyAccess, constant);

                    pkPredicate = pkPredicate == null
                        ? equality
                        : Expression.AndAlso(pkPredicate, equality);
                }
            }

            if (pkPredicate == null)
                return false;

            // 3. Append Soft Delete check if entity supports IsDeleted
            Expression finalPredicate = pkPredicate;
            var isDeletedProp = clrType.GetProperty("IsDeleted");
            if (isDeletedProp != null && isDeletedProp.PropertyType == typeof(bool))
            {
                var isDeletedAccess = Expression.Property(parameter, isDeletedProp);
                var notDeleted = Expression.Not(isDeletedAccess);
                finalPredicate = Expression.AndAlso(pkPredicate, notDeleted);
            }

            var lambda = Expression.Lambda(finalPredicate, parameter);

            // 4. Invoke DbSet<T>().AsNoTracking().AnyAsync(lambda) via reflection
            var setMethod = typeof(DbContext).GetMethod(nameof(DbContext.Set), Type.EmptyTypes)!
                .MakeGenericMethod(clrType);
            var dbSet = setMethod.Invoke(dbContext, null);

            var asNoTrackingMethod = typeof(EntityFrameworkQueryableExtensions)
                .GetMethods(BindingFlags.Public | BindingFlags.Static)
                .First(m => m.Name == nameof(EntityFrameworkQueryableExtensions.AsNoTracking) && m.GetParameters().Length == 1)
                .MakeGenericMethod(clrType);
            var noTrackingQuery = asNoTrackingMethod.Invoke(null, [dbSet]);

            var anyAsyncMethod = typeof(EntityFrameworkQueryableExtensions)
                .GetMethods(BindingFlags.Public | BindingFlags.Static)
                .First(m => m.Name == nameof(EntityFrameworkQueryableExtensions.AnyAsync) && m.GetParameters().Length == 3)
                .MakeGenericMethod(clrType);

            var task = (Task<bool>)anyAsyncMethod.Invoke(null, [noTrackingQuery, lambda, cancellationToken])!;
            return await task;
        }
        catch
        {
            return false;
        }
    }

    /// <summary>
    /// Parses a composite key string such as "RoleId=1,PermissionId=2" or "1,2" into strongly-typed property values.
    /// </summary>
    public static Dictionary<string, object?>? ParseCompositeKeyValues(
        string recordId,
        IReadOnlyList<IProperty> pkProperties)
    {
        var result = new Dictionary<string, object?>(StringComparer.OrdinalIgnoreCase);
        var parts = recordId.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

        if (parts.Length == 0)
            return null;

        var hasKeyValuePairs = parts.Any(p => p.Contains('='));

        if (hasKeyValuePairs)
        {
            foreach (var part in parts)
            {
                var kv = part.Split('=', 2, StringSplitOptions.TrimEntries);
                if (kv.Length != 2)
                    continue;

                var propName = kv[0];
                var propVal = kv[1];

                var targetProp = pkProperties.FirstOrDefault(p =>
                    string.Equals(p.Name, propName, StringComparison.OrdinalIgnoreCase));

                if (targetProp != null)
                {
                    result[targetProp.Name] = ConvertValue(propVal, targetProp.ClrType);
                }
            }
        }
        else if (parts.Length == pkProperties.Count)
        {
            for (var i = 0; i < pkProperties.Count; i++)
            {
                var targetProp = pkProperties[i];
                result[targetProp.Name] = ConvertValue(parts[i], targetProp.ClrType);
            }
        }

        return result;
    }

    /// <summary>
    /// Safely converts a string representation of an ID / key into its target CLR type.
    /// </summary>
    public static object? ConvertValue(string? rawValue, Type targetType)
    {
        if (string.IsNullOrWhiteSpace(rawValue))
            return null;

        var underlyingType = Nullable.GetUnderlyingType(targetType) ?? targetType;

        try
        {
            if (underlyingType == typeof(Guid))
            {
                return Guid.TryParse(rawValue, out var g) ? g : null;
            }
            if (underlyingType == typeof(int))
            {
                return int.TryParse(rawValue, out var i) ? i : null;
            }
            if (underlyingType == typeof(long))
            {
                return long.TryParse(rawValue, out var l) ? l : null;
            }
            if (underlyingType == typeof(string))
            {
                return rawValue;
            }
            if (underlyingType.IsEnum)
            {
                return Enum.TryParse(underlyingType, rawValue, ignoreCase: true, out var e) ? e : null;
            }

            return Convert.ChangeType(rawValue, underlyingType);
        }
        catch
        {
            return null;
        }
    }

    /// <summary>
    /// Deserializes OldValues and NewValues JSON snapshots into a structured list of property changes,
    /// translating enum integer values to their readable string names using EF Core metadata.
    /// </summary>
    public static List<AuditLogChangeDto> ParseChanges(
        string? oldValuesJson,
        string? newValuesJson,
        IEntityType? entityType)
    {
        var oldDict = ParseJsonToDictionary(oldValuesJson);
        var newDict = ParseJsonToDictionary(newValuesJson);

        var allKeys = new HashSet<string>(oldDict.Keys, StringComparer.OrdinalIgnoreCase);
        foreach (var key in newDict.Keys)
        {
            allKeys.Add(key);
        }

        var changes = new List<AuditLogChangeDto>(allKeys.Count);

        foreach (var key in allKeys.OrderBy(k => k))
        {
            if (AuditLogEnricher.IsBlacklisted(key))
                continue;

            oldDict.TryGetValue(key, out var oldVal);
            newDict.TryGetValue(key, out var newVal);

            // Check if this property corresponds to an Enum type
            var propMetadata = entityType?.FindProperty(key) ??
                               entityType?.GetProperties().FirstOrDefault(p =>
                                   string.Equals(p.Name, key, StringComparison.OrdinalIgnoreCase));

            Type? targetClrType = propMetadata?.ClrType;
            if (targetClrType == null && entityType != null)
            {
                var clrProp = entityType.ClrType.GetProperty(key, BindingFlags.Public | BindingFlags.Instance | BindingFlags.IgnoreCase);
                if (clrProp != null)
                {
                    targetClrType = clrProp.PropertyType;
                }
            }

            if (targetClrType != null)
            {
                var enumType = Nullable.GetUnderlyingType(targetClrType) ?? targetClrType;
                if (enumType.IsEnum)
                {
                    oldVal = FormatEnumValue(oldVal, enumType);
                    newVal = FormatEnumValue(newVal, enumType);
                }
            }

            changes.Add(new AuditLogChangeDto
            {
                PropertyName = key,
                FormattedPropertyName = AuditLogEnricher.FormatPropertyName(key),
                OldValue = oldVal,
                NewValue = newVal,
                OldValueRaw = oldVal,
                NewValueRaw = newVal
            });
        }

        return changes;
    }

    /// <summary>
    /// Converts a raw string / integer value into its Enum string name representation if valid.
    /// </summary>
    public static string? FormatEnumValue(string? rawValue, Type enumType)
    {
        if (string.IsNullOrWhiteSpace(rawValue))
            return rawValue;

        // If it's already a defined enum name string, keep it
        if (Enum.IsDefined(enumType, rawValue))
            return rawValue;

        // If it's an integer / numeric string, resolve its Enum Name
        if (int.TryParse(rawValue, out var intVal))
        {
            var name = Enum.GetName(enumType, intVal);
            if (!string.IsNullOrWhiteSpace(name))
                return name;
        }
        else if (long.TryParse(rawValue, out var longVal))
        {
            var name = Enum.GetName(enumType, longVal);
            if (!string.IsNullOrWhiteSpace(name))
                return name;
        }
        else if (Enum.TryParse(enumType, rawValue, ignoreCase: true, out var parsedEnum))
        {
            return parsedEnum.ToString();
        }

        return rawValue;
    }

    public static Dictionary<string, string?> ParseJsonToDictionary(string? json)
    {
        var dict = new Dictionary<string, string?>(StringComparer.OrdinalIgnoreCase);
        if (string.IsNullOrWhiteSpace(json))
            return dict;

        try
        {
            using var doc = JsonDocument.Parse(json);
            if (doc.RootElement.ValueKind == JsonValueKind.Object)
            {
                foreach (var prop in doc.RootElement.EnumerateObject())
                {
                    dict[prop.Name] = FormatJsonValue(prop.Value);
                }
            }
        }
        catch
        {
            // Ignore malformed JSON gracefully
        }

        return dict;
    }

    public static string? FormatJsonValue(JsonElement element)
    {
        return element.ValueKind switch
        {
            JsonValueKind.Null or JsonValueKind.Undefined => null,
            JsonValueKind.String => element.GetString(),
            JsonValueKind.Number => element.GetRawText(),
            JsonValueKind.True => "true",
            JsonValueKind.False => "false",
            _ => element.GetRawText()
        };
    }

    /// <summary>
    /// Enriches audit log items with human-readable foreign key names, context-aware titles, and navigation routes.
    /// </summary>
    public static Task ResolveHumanReadableNamesAsync(
        List<AuditLogItemDto> items,
        IApplicationDbContext context,
        CancellationToken cancellationToken)
    {
        return AuditLogEnricher.EnrichAsync(items, context, cancellationToken);
    }

    /// <summary>
    /// Enriches audit log items with direct frontend navigation routes.
    /// </summary>
    public static Task ResolveNavigationRoutesAsync(
        List<AuditLogItemDto> items,
        IApplicationDbContext context,
        CancellationToken ct)
    {
        return AuditLogEnricher.EnrichAsync(items, context, ct);
    }
}
