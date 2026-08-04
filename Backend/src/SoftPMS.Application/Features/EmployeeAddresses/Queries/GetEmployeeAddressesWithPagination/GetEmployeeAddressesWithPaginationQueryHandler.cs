using AutoMapper;
using AutoMapper.QueryableExtensions;
using MediatR;
using Microsoft.EntityFrameworkCore;
using SoftPMS.Application.Common.Extensions;
using SoftPMS.Application.Common.Interfaces;
using SoftPMS.Application.Common.Models;
using SoftPMS.Application.Features.EmployeeAddresses.DTOs;

namespace SoftPMS.Application.Features.EmployeeAddresses.Queries.GetEmployeeAddressesWithPagination;

public sealed class GetEmployeeAddressesWithPaginationQueryHandler(
    IApplicationDbContext context,
    IMapper mapper)
    : IRequestHandler<GetEmployeeAddressesWithPaginationQuery, PaginatedList<EmployeeAddressDto>>
{
    public async Task<PaginatedList<EmployeeAddressDto>> Handle(
        GetEmployeeAddressesWithPaginationQuery request,
        CancellationToken cancellationToken)
    {
        var query = context.EmployeeAddresses
            .AsNoTracking();

        if (request.EmployeeId.HasValue && request.EmployeeId.Value != Guid.Empty)
        {
            query = query.Where(a => a.EmployeeId == request.EmployeeId.Value);
        }

        query = query.ApplyDynamicFilters(request.Filters);

        var today = DateTime.UtcNow.Date;
        query = query
            .OrderByDescending(a => a.EndDate == null || a.EndDate >= today)
            .ThenByDescending(a => a.IsPrimary)
            .ThenByDescending(a => a.StartDate);

        var projectedQuery = query.ProjectTo<EmployeeAddressDto>(mapper.ConfigurationProvider);

        return await PaginatedList<EmployeeAddressDto>.CreateAsync(
            projectedQuery,
            request.PageNumber,
            request.PageSize,
            cancellationToken);
    }
}
