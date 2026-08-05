using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using SoftPMS.Application.Common.Interfaces;
using SoftPMS.Application.Features.Notifications.DTOs;
using SoftPMS.Domain.Entities;
using SoftPMS.Domain.Exceptions;

namespace SoftPMS.Application.Features.Notifications.Commands.ToggleNotificationReadStatus;

public class ToggleNotificationReadStatusCommandHandler : IRequestHandler<ToggleNotificationReadStatusCommand, UserNotificationDto>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly IMapper _mapper;

    public ToggleNotificationReadStatusCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService,
        IMapper mapper)
    {
        _context = context;
        _currentUserService = currentUserService;
        _mapper = mapper;
    }

    public async Task<UserNotificationDto> Handle(
        ToggleNotificationReadStatusCommand request,
        CancellationToken cancellationToken)
    {
        var currentUserId = _currentUserService.UserId;

        var notification = await _context.UserNotifications
            .FirstOrDefaultAsync(n => n.Id == request.NotificationId && n.UserId == currentUserId, cancellationToken);

        if (notification == null)
        {
            throw new NotFoundException(nameof(UserNotification), request.NotificationId);
        }

        notification.IsRead = !notification.IsRead;
        notification.ReadAt = notification.IsRead ? DateTime.UtcNow : null;

        await _context.SaveChangesAsync(cancellationToken);

        return _mapper.Map<UserNotificationDto>(notification);
    }
}
