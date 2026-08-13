using MediatR;

namespace SoftPMS.Application.Features.Notifications.Commands.MarkNotificationAsUnread;

/// <summary>
/// Represents the Command to mark notification as unread.
/// </summary>
public record MarkNotificationAsUnreadCommand(Guid NotificationId) : IRequest<bool>;


