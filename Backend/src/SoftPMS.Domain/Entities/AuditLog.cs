namespace SoftPMS.Domain.Entities;

/// <summary>
/// Immutable audit trail record capturing state mutations, correlation tracing, and delta snapshots.
/// </summary>
public class AuditLog
{
    public long Id { get; set; }

    /// <summary>
    /// Correlation identifier linking multiple entity changes occurring within the same unit of work / transaction.
    /// </summary>
    public Guid CorrelationId { get; set; }

    public string TableName { get; set; } = string.Empty;

    public string RecordId { get; set; } = string.Empty;

    public string Action { get; set; } = string.Empty;

    /// <summary>
    /// JSON delta snapshot of original values prior to modification or deletion.
    /// </summary>
    public string? OldValues { get; set; }

    /// <summary>
    /// JSON delta snapshot of new values after creation or modification.
    /// </summary>
    public string? NewValues { get; set; }

    /// <summary>
    /// User ID of the actor who performed the change (null for anonymous/system operations).
    /// </summary>
    public string? ChangedByUserId { get; set; }

    /// <summary>
    /// Email address or system identifier of the actor who performed the change.
    /// Stored deliberately as email for clear enterprise auditing and non-ambiguous actor identification.
    /// </summary>
    public string ChangedByEmail { get; set; } = string.Empty;

    public DateTime ChangedAt { get; set; }
}
