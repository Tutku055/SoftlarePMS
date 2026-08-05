using SoftPMS.Domain.Enums;

namespace SoftPMS.Application.Features.Notifications.Configurations;

/// <summary>
/// Metadata definition for a notification type.
/// Serves as the code-first, file-based single source of truth for defaults and templates.
/// </summary>
public record NotificationTypeDefinition(
    NotificationType Type,
    string TypeName,
    string Description,
    int DefaultReminderDays,
    NotificationDeliveryChannel DefaultDeliveryChannel,
    bool DefaultIsMuted,
    string DefaultTitleTemplate,
    string DefaultMessageTemplate,
    string[] SupportedPlaceholders
);
