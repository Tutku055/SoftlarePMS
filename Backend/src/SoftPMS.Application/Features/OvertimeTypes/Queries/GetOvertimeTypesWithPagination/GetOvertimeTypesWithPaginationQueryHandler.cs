using MediatR;
using Microsoft.EntityFrameworkCore;
using SoftPMS.Application.Common.Extensions;
using SoftPMS.Application.Common.Interfaces;
using SoftPMS.Application.Common.Models;
using SoftPMS.Application.Features.OvertimeTypes.DTOs;

namespace SoftPMS.Application.Features.OvertimeTypes.Queries.GetOvertimeTypesWithPagination;

public sealed class GetOvertimeTypesWithPaginationQueryHandler(
    IApplicationDbContext context)
    : IRequestHandler<GetOvertimeTypesWithPaginationQuery, PaginatedList<OvertimeTypeDto>>
{
    public async Task<PaginatedList<OvertimeTypeDto>> Handle(
        GetOvertimeTypesWithPaginationQuery request,
        CancellationToken cancellationToken)
    {
        // Use IgnoreQueryFilters so we can see soft-deleted records if we want to filter for them
        var query = context.OvertimeTypes.IgnoreQueryFilters().AsQueryable();

        if (!string.IsNullOrWhiteSpace(request.SearchTerm))
        {
            var search = request.SearchTerm.Trim().ToLower();
            query = query.Where(d => d.Name.ToLower().Contains(search));
        }

        query = query.ApplyDynamicFilters(request.Filters);

        var projectedQuery = query
            .OrderBy(d => d.Name)
            .Select(x => new OvertimeTypeDto(x.Id, x.Name, x.Multiplier, !x.IsDeleted));

        return await PaginatedList<OvertimeTypeDto>.CreateAsync(
            projectedQuery,
            request.PageNumber,
            request.PageSize,
            cancellationToken);
    }
}
