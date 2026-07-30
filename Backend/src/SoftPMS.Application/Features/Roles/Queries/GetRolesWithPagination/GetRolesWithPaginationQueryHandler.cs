using AutoMapper;
using AutoMapper.QueryableExtensions;
using MediatR;
using SoftPMS.Application.Common.Interfaces;
using SoftPMS.Application.Common.Models;
using SoftPMS.Application.Features.Roles.DTOs;
using SoftPMS.Application.Common.Extensions;
using Microsoft.EntityFrameworkCore;

namespace SoftPMS.Application.Features.Roles.Queries.GetRolesWithPagination;

public sealed class GetRolesWithPaginationQueryHandler(
    IApplicationDbContext context,
    IMapper mapper)
    : IRequestHandler<GetRolesWithPaginationQuery, PaginatedList<RoleListDto>>
{
    public async Task<PaginatedList<RoleListDto>> Handle(
        GetRolesWithPaginationQuery request,
        CancellationToken cancellationToken)
    {
        var query = context.Roles
            .Where(r => r.Name != "SuperAdmin") // Protect SuperAdmin
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(request.SearchTerm))
        {
            var search = request.SearchTerm.Trim().ToLower();
            query = query.Where(r => r.Name.ToLower().Contains(search) || r.Description.ToLower().Contains(search));
        }

        query = query.ApplyDynamicFilters(request.Filters);

        var projectedQuery = query
            .OrderBy(r => r.Name)
            .ProjectTo<RoleListDto>(mapper.ConfigurationProvider);

        return await PaginatedList<RoleListDto>.CreateAsync(
            projectedQuery,
            request.PageNumber,
            request.PageSize,
            cancellationToken);
    }
}
