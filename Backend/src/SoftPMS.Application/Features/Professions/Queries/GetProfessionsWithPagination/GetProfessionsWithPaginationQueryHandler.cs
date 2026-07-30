using AutoMapper;
using AutoMapper.QueryableExtensions;
using MediatR;
using Microsoft.EntityFrameworkCore;
using SoftPMS.Application.Common.Extensions;
using SoftPMS.Application.Common.Interfaces;
using SoftPMS.Application.Common.Models;
using SoftPMS.Application.Features.Professions.DTOs;

namespace SoftPMS.Application.Features.Professions.Queries.GetProfessionsWithPagination;

public sealed class GetProfessionsWithPaginationQueryHandler(
    IApplicationDbContext context,
    IMapper mapper)
    : IRequestHandler<GetProfessionsWithPaginationQuery, PaginatedList<ProfessionDto>>
{
    public async Task<PaginatedList<ProfessionDto>> Handle(GetProfessionsWithPaginationQuery request, CancellationToken cancellationToken)
    {
        var query = context.Professions
            .Include(p => p.Employees)
            .AsNoTracking();

        query = query.ApplyDynamicFilters(request.Filters);
        query = query.OrderBy(p => p.Name);

        var projectedQuery = query.ProjectTo<ProfessionDto>(mapper.ConfigurationProvider);

        return await PaginatedList<ProfessionDto>.CreateAsync(
            projectedQuery,
            request.PageNumber,
            request.PageSize,
            cancellationToken);
    }
}
