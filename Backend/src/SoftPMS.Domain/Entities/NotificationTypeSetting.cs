using SoftPMS.Domain.Enums;

namespace SoftPMS.Domain.Entities;

/// <summary>
/// Persisted configuration for a passive notification type.
/// Allows authorized users to adjust reminder thresholds, delivery channel, and mute/unmute status.
/// Initial defaults are loaded from file-based configuration (NotificationRegistry).
/// </summary>
public class NotificationTypeSetting : BaseEntity
{
    /// <summary>Unique notification type key.</summary>
    public NotificationType Type { get; set; }

    /// <summary>Human-readable display name for the notification type.</summary>
    public string TypeName { get; set; } = string.Empty;

    /// <summary>Description explaining the trigger condition and scope of this notification.</summary>
    public string Description { get; set; } = string.Empty;

    /// <summary>
    /// When true, this passive notification type is completely muted and suppressed by the evaluator/dispatcher.
    /// </summary>
    public bool IsMuted { get; set; } = false;

    /// <summary>
    /// The reminder threshold in days (e.g., 7, 14, 30 days before target date).
    /// Used by the passive evaluator to determine when notifications should be triggered.
    /// </summary>
    public int ReminderDays { get; set; } = 7;

    /// <summary>
    /// The delivery channel: System (in-app only) or SystemAndMail (in-app + HTML email via EmailService).
    /// </summary>
    public NotificationDeliveryChannel DeliveryChannel { get; set; } = NotificationDeliveryChannel.System;

    /// <summary>Timestamp when this setting was last updated by an authorized user.</summary>
    public DateTime? UpdatedAt { get; set; }
}
