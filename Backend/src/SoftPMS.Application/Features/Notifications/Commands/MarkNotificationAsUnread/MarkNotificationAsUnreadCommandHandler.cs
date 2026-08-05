using MediatR;
using Microsoft.EntityFrameworkCore;
using SoftPMS.Application.Common.Interfaces;
using SoftPMS.Domain.Entities;
using SoftPMS.Domain.Exceptions;

namespace SoftPMS.Application.Features.Notifications.Commands.MarkNotificationAsUnread;

public class MarkNotificationAsUnreadCommandHandler : IRequestHandler<MarkNotificationAsUnreadCommand, bool>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public MarkNotificationAsUnreadCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<bool> Handle(
        MarkNotificationAsUnreadCommand request,
        CancellationToken cancellationToken)
    {
        var currentUserId = _currentUserService.UserId;

        var notification = await _context.UserNotifications
            .FirstOrDefaultAsync(n => n.Id == request.NotificationId && n.UserId == currentUserId, cancellationToken);

        if (notification == null)
        {
            throw new NotFoundException(nameof(UserNotification), request.NotificationId);
        }

        if (notification.IsRead)
        {
            notification.IsRead = false;
            notification.ReadAt = null;
            await _context.SaveChangesAsync(cancellationToken);
        }

        return true;
    }
}
