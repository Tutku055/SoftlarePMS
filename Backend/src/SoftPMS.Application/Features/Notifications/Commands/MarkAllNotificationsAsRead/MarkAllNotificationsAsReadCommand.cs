using MediatR;

namespace SoftPMS.Application.Features.Notifications.Commands.MarkAllNotificationsAsRead;

public record MarkAllNotificationsAsReadCommand : IRequest<int>;
