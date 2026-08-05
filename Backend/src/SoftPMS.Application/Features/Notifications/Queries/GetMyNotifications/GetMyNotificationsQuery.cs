using MediatR;
using SoftPMS.Application.Common.Models;
using SoftPMS.Application.Features.Notifications.DTOs;
using SoftPMS.Domain.Enums;

namespace SoftPMS.Application.Features.Notifications.Queries.GetMyNotifications;

public class GetMyNotificationsQuery : IRequest<PaginatedList<UserNotificationDto>>
{
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 10;
    public bool? IsRead { get; set; }
    public NotificationType? Type { get; set; }
}
