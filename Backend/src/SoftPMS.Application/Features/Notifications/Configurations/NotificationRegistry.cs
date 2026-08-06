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
            Description: "Passive alerts triggered for expiring employee documents and certificates within the configured reminder window.",
            DefaultReminderDays: 14,
            DefaultDeliveryChannel: NotificationDeliveryChannel.SystemAndMail,
            DefaultIsMuted: false,
            DefaultTitleTemplate: "Document Expiring: {DocumentName} ({EmployeeName})",
            DefaultMessageTemplate: "The document '{DocumentName}' for {EmployeeName} is scheduled to expire on {ExpiryDate}.",
            SupportedPlaceholders: new[] { "{DocumentName}", "{EmployeeName}", "{ExpiryDate}" },
            RequiredPermissions: new[] { "Documents.Read" }
        ),

        [NotificationType.FinanceAlert] = new(
            Type: NotificationType.FinanceAlert,
            TypeName: "Finance Alert",
            Description: "Passive alerts triggered per employee when missing monthly timesheets or payroll slips are detected before period cutoff.",
            DefaultReminderDays: 5,
            DefaultDeliveryChannel: NotificationDeliveryChannel.SystemAndMail,
            DefaultIsMuted: false,
            DefaultTitleTemplate: "Missing Timesheet & Payroll: {EmployeeName}",
            DefaultMessageTemplate: "Missing timesheet and payroll records for {EmployeeName} for period {Period}.",
            SupportedPlaceholders: new[] { "{EmployeeName}", "{Period}" },
            RequiredPermissions: new[] { "Timesheets.Read", "Payrolls.Read" }
        ),

        [NotificationType.SystemAnnouncement] = new(
            Type: NotificationType.SystemAnnouncement,
            TypeName: "System Announcement",
            Description: "System audit anomalies, security mutations, and administrative alerts for managers.",
            DefaultReminderDays: 0,
            DefaultDeliveryChannel: NotificationDeliveryChannel.System,
            DefaultIsMuted: false,
            DefaultTitleTemplate: "System Notice: {Title}",
            DefaultMessageTemplate: "{Message}",
            SupportedPlaceholders: new[] { "{Title}", "{Message}" },
            RequiredPermissions: new[] { "AuditLogs.Read", "SystemSettings.YearEndOperations" }
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
            SupportedPlaceholders: new[] { "{EventTitle}", "{EventDate}" },
            RequiredPermissions: Array.Empty<string>()
        )
    };

    public static IReadOnlyCollection<NotificationTypeDefinition> GetAllDefinitions() => Definitions.Values;

    public static NotificationTypeDefinition? GetDefinition(NotificationType type) =>
        Definitions.TryGetValue(type, out var def) ? def : null;

    public static bool IsRegistered(NotificationType type) => Definitions.ContainsKey(type);
}

