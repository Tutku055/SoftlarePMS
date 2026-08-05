using SoftPMS.Domain.Enums;

namespace SoftPMS.Domain.Entities;

/// <summary>
/// Transactional Outbox Entity for guaranteed, reliable asynchronous email dispatch.
/// Written to the database within the exact same database transaction as the business event (UserNotification),
/// preventing Dual-Write failures and decoupling external SMTP latency from the core application pipeline.
/// </summary>
public class NotificationOutbox : BaseEntity
{
    /// <summary>The recipient's target email address.</summary>
    public string RecipientEmail { get; set; } = string.Empty;

    /// <summary>Optional recipient display name or username for personalization.</summary>
    public string? RecipientName { get; set; }

    /// <summary>The subject line of the email.</summary>
    public string Subject { get; set; } = string.Empty;

    /// <summary>The compiled HTML body content ready for SMTP transmission.</summary>
    public string BodyHtml { get; set; } = string.Empty;

    /// <summary>Current processing status in the Outbox lifecycle.</summary>
    public OutboxStatus Status { get; set; } = OutboxStatus.Pending;

    /// <summary>Number of delivery attempts executed so far.</summary>
    public int RetryCount { get; set; } = 0;

    /// <summary>Maximum retry attempts before marking the record as permanently failed.</summary>
    public int MaxRetries { get; set; } = 3;

    /// <summary>
    /// Earliest UTC timestamp when the background worker may attempt the next delivery.
    /// Used for exponential backoff scheduling.
    /// </summary>
    public DateTime? NextRetryAtUtc { get; set; }

    /// <summary>Timestamp when the email was successfully sent.</summary>
    public DateTime? ProcessedAtUtc { get; set; }

    /// <summary>Detailed exception message or diagnostic failure info if the last attempt failed.</summary>
    public string? ErrorMessage { get; set; }

    /// <summary>Optional identifier linking this outbox entry to the generated UserNotification.</summary>
    public Guid? NotificationId { get; set; }
}
