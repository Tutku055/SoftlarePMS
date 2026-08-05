using MediatR;
using Microsoft.EntityFrameworkCore;
using SoftPMS.Application.Common.Interfaces;
using SoftPMS.Domain.Entities;
using SoftPMS.Domain.Exceptions;

namespace SoftPMS.Application.Features.Notifications.Commands.DeleteNotification;

public class DeleteNotificationCommandHandler : IRequestHandler<DeleteNotificationCommand, bool>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public DeleteNotificationCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<bool> Handle(
        DeleteNotificationCommand request,
        CancellationToken cancellationToken)
    {
        var currentUserId = _currentUserService.UserId;

        var notification = await _context.UserNotifications
            .FirstOrDefaultAsync(n => n.Id == request.NotificationId && n.UserId == currentUserId, cancellationToken);

        if (notification == null)
        {
            throw new NotFoundException(nameof(UserNotification), request.NotificationId);
        }

        _context.UserNotifications.Remove(notification);
        await _context.SaveChangesAsync(cancellationToken);

        return true;
    }
}
