namespace SoftPMS.Application.Features.SystemSettings.DTOs;

/// <summary>
/// DTO representing a grouped audit trail transaction (one or more entity mutations executed together),
/// enriched with high-level metadata, summary action labels, dynamic database existence status, and lazy sub-items.
/// </summary>
public sealed class AuditLogDto
{
    public long Id { get; set; }

    /// <summary>
    /// Transaction correlation identifier grouping mutations executed within the same unit of work.
    /// </summary>
    public Guid CorrelationId { get; set; }

    /// <summary>
    /// Database table or entity name (or comma-separated distinct table names if multi-entity transaction).
    /// </summary>
    public string TableName { get; set; } = string.Empty;

    /// <summary>
    /// Primary key identifier of the audited record (or summary if multi-entity transaction).
    /// </summary>
    public string RecordId { get; set; } = string.Empty;

    /// <summary>
    /// Mutation action or summary action label (e.g. "Created", "Modified", "Deleted", "Created (1280 items)", "Updated (5 changes)").
    /// </summary>
    public string Action { get; set; } = string.Empty;

    /// <summary>
    /// Normalized semantic action type for UI badge styling: "created", "modified", "deleted", or "updated".
    /// </summary>
    public string ActionType { get; set; } = string.Empty;

    /// <summary>
    /// Total count of individual entity mutation items in this transaction (e.g. 1 for single item, 1280 for bulk batch).
    /// </summary>
    public int ItemCount { get; set; } = 1;

    /// <summary>
    /// User ID of the actor who performed the change.
    /// </summary>
    public string? ChangedByUserId { get; set; }

    /// <summary>
    /// Email or system identifier of the actor who performed the change.
    /// </summary>
    public string ChangedByEmail { get; set; } = string.Empty;

    /// <summary>
    /// UTC timestamp of when the change occurred.
    /// </summary>
    public DateTime ChangedAt { get; set; }

    /// <summary>
    /// Dynamic flag indicating whether the audited entity currently exists (and is not deleted) in the database.
    /// </summary>
    public bool IsEntityActive { get; set; }

    /// <summary>
    /// Total count of property-level changes across all sub-items in this transaction.
    /// </summary>
    public int TotalChangesCount { get; set; }

    /// <summary>
    /// Parsed property-level delta changes extracted from JSON snapshots (populated for single items).
    /// </summary>
    public List<AuditLogChangeDto> Changes { get; set; } = [];

    /// <summary>
    /// Context-aware human-readable entity header title (e.g. "John Doe - 08/2026 Timesheet").
    /// </summary>
    public string? EntityTitle { get; set; }

    /// <summary>
    /// Direct frontend application navigation route calculated for this audited entity or transaction.
    /// </summary>
    public string? NavigationRoute { get; set; }

    /// <summary>
    /// Detailed sub-item records for all individual entities mutated in this transaction (populated on demand via lazy detail endpoint).
    /// </summary>
    public List<AuditLogItemDto> Items { get; set; } = [];
}
