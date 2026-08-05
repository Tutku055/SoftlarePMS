using AutoMapper;
using AutoMapper.QueryableExtensions;
using MediatR;
using Microsoft.EntityFrameworkCore;
using SoftPMS.Application.Common.Interfaces;
using SoftPMS.Application.Common.Models;
using SoftPMS.Application.Features.Notifications.DTOs;

namespace SoftPMS.Application.Features.Notifications.Queries.GetMyNotifications;

public class GetMyNotificationsQueryHandler : IRequestHandler<GetMyNotificationsQuery, PaginatedList<UserNotificationDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly IMapper _mapper;

    public GetMyNotificationsQueryHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService,
        IMapper mapper)
    {
        _context = context;
        _currentUserService = currentUserService;
        _mapper = mapper;
    }

    public async Task<PaginatedList<UserNotificationDto>> Handle(
        GetMyNotificationsQuery request,
        CancellationToken cancellationToken)
    {
        var currentUserId = _currentUserService.UserId;

        var query = _context.UserNotifications
            .AsNoTracking()
            .Where(n => n.UserId == currentUserId);

        if (request.IsRead.HasValue)
        {
            query = query.Where(n => n.IsRead == request.IsRead.Value);
        }

        if (request.Type.HasValue)
        {
            query = query.Where(n => n.Type == request.Type.Value);
        }

        query = query.OrderByDescending(n => n.CreatedAt);

        var dtoQuery = query.ProjectTo<UserNotificationDto>(_mapper.ConfigurationProvider);

        return await PaginatedList<UserNotificationDto>.CreateAsync(
            dtoQuery,
            request.PageNumber,
            request.PageSize,
            cancellationToken);
    }
}

