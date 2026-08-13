using MediatR;

namespace SoftPMS.Application.Features.Notifications.Commands.MarkAllNotificationsAsRead;

/// <summary>
/// Represents the Command to mark all notifications as read.
/// </summary>
public record MarkAllNotificationsAsReadCommand : IRequest<int>;


