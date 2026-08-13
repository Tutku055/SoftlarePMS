using MediatR;
using SoftPMS.Application.Features.Notifications.DTOs;
using SoftPMS.Domain.Enums;

namespace SoftPMS.Application.Features.Notifications.Commands.AdjustNotificationThreshold;

/// <summary>
/// Represents the Command to adjust notification threshold.
/// </summary>
public record AdjustNotificationThresholdCommand(
    NotificationType Type,
    int ReminderDays,
    NotificationDeliveryChannel DeliveryChannel
) : IRequest<NotificationTypeSettingDto>;


