using MediatR;

namespace SoftPMS.Application.Features.Notifications.Commands.MarkNotificationAsRead;

/// <summary>
/// Represents the Command to mark notification as read.
/// </summary>
public record MarkNotificationAsReadCommand(Guid NotificationId) : IRequest<bool>;


