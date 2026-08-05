using MediatR;
using Microsoft.EntityFrameworkCore;
using SoftPMS.Application.Common.Interfaces;
using SoftPMS.Application.Features.Notifications.DTOs;

namespace SoftPMS.Application.Features.Notifications.Queries.GetUnreadCount;

public class GetUnreadNotificationCountQueryHandler : IRequestHandler<GetUnreadNotificationCountQuery, NotificationSummaryDto>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public GetUnreadNotificationCountQueryHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<NotificationSummaryDto> Handle(
        GetUnreadNotificationCountQuery request,
        CancellationToken cancellationToken)
    {
        var currentUserId = _currentUserService.UserId;

        var unreadCount = await _context.UserNotifications
            .AsNoTracking()
            .CountAsync(n => n.UserId == currentUserId && !n.IsRead, cancellationToken);

        var totalCount = await _context.UserNotifications
            .AsNoTracking()
            .CountAsync(n => n.UserId == currentUserId, cancellationToken);

        return new NotificationSummaryDto
        {
            UnreadCount = unreadCount,
            TotalCount = totalCount
        };
    }
}
