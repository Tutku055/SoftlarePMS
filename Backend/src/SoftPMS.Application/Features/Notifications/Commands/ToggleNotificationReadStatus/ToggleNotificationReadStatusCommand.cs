using MediatR;
using SoftPMS.Application.Features.Notifications.DTOs;

namespace SoftPMS.Application.Features.Notifications.Commands.ToggleNotificationReadStatus;

public record ToggleNotificationReadStatusCommand(Guid NotificationId) : IRequest<UserNotificationDto>;
