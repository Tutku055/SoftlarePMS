using MediatR;

namespace SoftPMS.Application.Features.Notifications.Commands.MarkNotificationAsUnread;

public record MarkNotificationAsUnreadCommand(Guid NotificationId) : IRequest<bool>;
