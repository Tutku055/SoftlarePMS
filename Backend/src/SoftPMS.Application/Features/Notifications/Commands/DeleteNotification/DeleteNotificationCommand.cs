using MediatR;

namespace SoftPMS.Application.Features.Notifications.Commands.DeleteNotification;

public record DeleteNotificationCommand(Guid NotificationId) : IRequest<bool>;
