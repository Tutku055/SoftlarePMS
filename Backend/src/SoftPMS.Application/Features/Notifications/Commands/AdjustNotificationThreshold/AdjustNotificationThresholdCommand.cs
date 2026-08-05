using MediatR;
using SoftPMS.Application.Features.Notifications.DTOs;
using SoftPMS.Domain.Enums;

namespace SoftPMS.Application.Features.Notifications.Commands.AdjustNotificationThreshold;

public record AdjustNotificationThresholdCommand(
    NotificationType Type,
    int ReminderDays,
    NotificationDeliveryChannel DeliveryChannel
) : IRequest<NotificationTypeSettingDto>;
