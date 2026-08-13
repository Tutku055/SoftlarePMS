using MediatR;

namespace SoftPMS.Application.Features.Notifications.Commands.DeleteNotification;

/// <summary>
/// Represents the Command to delete notification.
/// </summary>
public record DeleteNotificationCommand(Guid NotificationId) : IRequest<bool>;


