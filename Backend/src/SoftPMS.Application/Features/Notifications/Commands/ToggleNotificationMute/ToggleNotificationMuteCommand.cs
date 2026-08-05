using MediatR;
using SoftPMS.Application.Features.Notifications.DTOs;
using SoftPMS.Domain.Enums;

namespace SoftPMS.Application.Features.Notifications.Commands.ToggleNotificationMute;

public record ToggleNotificationMuteCommand(
    NotificationType Type,
    bool IsMuted
) : IRequest<NotificationTypeSettingDto>;
