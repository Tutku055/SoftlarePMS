using AutoMapper;
using AutoMapper.QueryableExtensions;
using MediatR;
using Microsoft.EntityFrameworkCore;
using SoftPMS.Application.Common.Extensions;
using SoftPMS.Application.Common.Interfaces;
using SoftPMS.Application.Common.Models;
using SoftPMS.Application.Features.Employees.DTOs;

namespace SoftPMS.Application.Features.Employees.Queries.GetEmployeesWithPagination;

public sealed class GetEmployeesWithPaginationQueryHandler(
    IApplicationDbContext context,
    IMapper mapper)
    : IRequestHandler<GetEmployeesWithPaginationQuery, PaginatedList<EmployeeDto>>
{
    public async Task<PaginatedList<EmployeeDto>> Handle(
        GetEmployeesWithPaginationQuery request,
        CancellationToken cancellationToken)
    {
        var query = context.Employees
            .Include(e => e.Department)
            .Include(e => e.Profession)
            .AsNoTracking();

        // Tek satırda tüm dinamik filtreleri uygula
        query = query.ApplyDynamicFilters(request.Filters);

        query = query.OrderBy(e => e.LastName).ThenBy(e => e.FirstName);

        var projectedQuery = query.ProjectTo<EmployeeDto>(mapper.ConfigurationProvider);

        return await PaginatedList<EmployeeDto>.CreateAsync(
            projectedQuery,
            request.PageNumber,
            request.PageSize,
            cancellationToken);
    }
}
