using MediatR;
using SoftPMS.Application.Features.Notifications.DTOs;

namespace SoftPMS.Application.Features.Notifications.Commands.ToggleNotificationReadStatus;

/// <summary>
/// Represents the Command to toggle notification read status.
/// </summary>
public record ToggleNotificationReadStatusCommand(Guid NotificationId) : IRequest<UserNotificationDto>;


