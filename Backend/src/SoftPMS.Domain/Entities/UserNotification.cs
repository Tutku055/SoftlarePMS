using SoftPMS.Domain.Enums;

namespace SoftPMS.Domain.Entities;

/// <summary>
/// Represents an individual user notification record created via Fan-out on Write.
/// Each recipient receives an isolated database record to track individual read status and lifecycle.
/// Timing & Urgency are delegated to frontend by storing raw timing values (TargetDate, RemainingDays).
/// </summary>
public class UserNotification : BaseEntity
{
    /// <summary>The recipient User's identifier.</summary>
    public Guid UserId { get; set; }

    /// <summary>The categorized notification type.</summary>
    public NotificationType Type { get; set; }

    /// <summary>Title or subject of the notification.</summary>
    public string Title { get; set; } = string.Empty;

    /// <summary>Descriptive message body or summary.</summary>
    public string Message { get; set; } = string.Empty;

    /// <summary>The delivery channel through which this notification was processed.</summary>
    public NotificationDeliveryChannel DeliveryChannel { get; set; } = NotificationDeliveryChannel.System;

    /// <summary>Whether the user has marked this notification as read.</summary>
    public bool IsRead { get; set; } = false;

    /// <summary>Timestamp when the notification was marked as read.</summary>
    public DateTime? ReadAt { get; set; }

    /// <summary>
    /// Raw target date for timing calculations (e.g., document expiry date, submission deadline).
    /// Urgency is calculated dynamically on the Frontend using this raw value.
    /// </summary>
    public DateTime? TargetDate { get; set; }

    /// <summary>
    /// Raw number of days remaining until TargetDate (or negative if overdue).
    /// Used by frontend to determine urgency tier dynamically.
    /// </summary>
    public int? RemainingDays { get; set; }

    /// <summary>Optional entity ID associated with this notification (e.g., Document ID, Timesheet ID).</summary>
    public Guid? EntityReferenceId { get; set; }

    /// <summary>Optional entity type name for navigation (e.g., "Document", "Timesheet", "Announcement").</summary>
    public string? EntityReferenceType { get; set; }

    /// <summary>Optional JSON payload containing raw contextual metadata for frontend use.</summary>
    public string? PayloadJson { get; set; }

    /// <summary>Soft delete flag.</summary>
    public bool IsDeleted { get; set; } = false;

    /// <summary>Timestamp when the notification was soft deleted.</summary>
    public DateTime? DeletedAt { get; set; }

    // Navigation property
    public virtual User User { get; set; } = null!;
}
