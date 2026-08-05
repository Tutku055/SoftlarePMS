using SoftPMS.Domain.Enums;

namespace SoftPMS.Application.Features.Notifications.Configurations;

/// <summary>
/// Centralized file-based registry containing all registered passive notification types,
/// default rules, reminder thresholds, and templates.
/// Allows developers to easily add or adjust notification types in code.
/// </summary>
public static class NotificationRegistry
{
    private static readonly Dictionary<NotificationType, NotificationTypeDefinition> Definitions = new()
    {
        [NotificationType.DocumentExpiry] = new(
            Type: NotificationType.DocumentExpiry,
            TypeName: "Document Expiry",
            Description: "Passive alerts triggered when an employee document or certificate is approaching its expiration date.",
            DefaultReminderDays: 14,
            DefaultDeliveryChannel: NotificationDeliveryChannel.SystemAndMail,
            DefaultIsMuted: false,
            DefaultTitleTemplate: "Document Expiring: {DocumentName}",
            DefaultMessageTemplate: "The document '{DocumentName}' for employee {EmployeeName} is set to expire on {ExpiryDate}.",
            SupportedPlaceholders: new[] { "{DocumentName}", "{EmployeeName}", "{ExpiryDate}" }
        ),

        [NotificationType.FinanceAlert] = new(
            Type: NotificationType.FinanceAlert,
            TypeName: "Finance Alert",
            Description: "Passive alerts triggered when unsubmitted or missing monthly timesheets are detected for the active period.",
            DefaultReminderDays: 3,
            DefaultDeliveryChannel: NotificationDeliveryChannel.SystemAndMail,
            DefaultIsMuted: false,
            DefaultTitleTemplate: "Missing Timesheets Alert: {MissingCount} Pending",
            DefaultMessageTemplate: "{MissingCount} employee timesheets are missing or unsubmitted for period {Period}.",
            SupportedPlaceholders: new[] { "{MissingCount}", "{Period}" }
        ),

        [NotificationType.SystemAnnouncement] = new(
            Type: NotificationType.SystemAnnouncement,
            TypeName: "System Announcement",
            Description: "System-wide passive alerts and maintenance updates broadcasted to all organization members.",
            DefaultReminderDays: 1,
            DefaultDeliveryChannel: NotificationDeliveryChannel.System,
            DefaultIsMuted: false,
            DefaultTitleTemplate: "System Notice: {Title}",
            DefaultMessageTemplate: "{Message}",
            SupportedPlaceholders: new[] { "{Title}", "{Message}" }
        ),

        [NotificationType.EventUpcoming] = new(
            Type: NotificationType.EventUpcoming,
            TypeName: "Upcoming Event",
            Description: "Passive reminders for scheduled company events, reviews, or milestones.",
            DefaultReminderDays: 7,
            DefaultDeliveryChannel: NotificationDeliveryChannel.System,
            DefaultIsMuted: false,
            DefaultTitleTemplate: "Upcoming Event: {EventTitle}",
            DefaultMessageTemplate: "Reminder for upcoming event '{EventTitle}' scheduled on {EventDate}.",
            SupportedPlaceholders: new[] { "{EventTitle}", "{EventDate}" }
        )
    };

    public static IReadOnlyCollection<NotificationTypeDefinition> GetAllDefinitions() => Definitions.Values;

    public static NotificationTypeDefinition? GetDefinition(NotificationType type) =>
        Definitions.TryGetValue(type, out var def) ? def : null;

    public static bool IsRegistered(NotificationType type) => Definitions.ContainsKey(type);
}
