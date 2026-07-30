using AutoMapper;
using AutoMapper.QueryableExtensions;
using MediatR;
using Microsoft.EntityFrameworkCore;
using SoftPMS.Application.Common.Extensions;
using SoftPMS.Application.Common.Interfaces;
using SoftPMS.Application.Common.Models;
using SoftPMS.Application.Features.Users.DTOs;

namespace SoftPMS.Application.Features.Users.Queries.GetUsersWithPagination;

public sealed class GetUsersWithPaginationQueryHandler(
    IApplicationDbContext context,
    IMapper mapper)
    : IRequestHandler<GetUsersWithPaginationQuery, PaginatedList<UserDto>>
{
    public async Task<PaginatedList<UserDto>> Handle(
        GetUsersWithPaginationQuery request,
        CancellationToken cancellationToken)
    {
        var query = context.Users
            .Include(u => u.Role)
            .Include(u => u.Employee)
            .AsNoTracking();

        query = query.ApplyDynamicFilters(request.Filters);

        query = query.OrderBy(u => u.Username);

        var totalCount = await query.CountAsync(cancellationToken);

        var users = await query
            .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToListAsync(cancellationToken);

        var userDtos = mapper.Map<List<UserDto>>(users);

        return PaginatedList<UserDto>.Create(
            userDtos,
            totalCount,
            request.PageNumber,
            request.PageSize);
    }
}
