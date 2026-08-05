using MediatR;
using SoftPMS.Application.Features.Notifications.DTOs;

namespace SoftPMS.Application.Features.Notifications.Queries.GetUnreadCount;

public record GetUnreadNotificationCountQuery : IRequest<NotificationSummaryDto>;
