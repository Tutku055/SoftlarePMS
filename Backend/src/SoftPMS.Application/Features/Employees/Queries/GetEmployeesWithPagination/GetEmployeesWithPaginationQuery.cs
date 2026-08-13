using MediatR;
using SoftPMS.Application.Common.Models;
using SoftPMS.Application.Features.Employees.DTOs;

namespace SoftPMS.Application.Features.Employees.Queries.GetEmployeesWithPagination;

/// <summary>
/// Represents the Query to get employees with pagination.
/// </summary>
public sealed record GetEmployeesWithPaginationQuery(
    int PageNumber,
    int PageSize,
    List<FilterCriteria>? Filters
) : IRequest<PaginatedList<EmployeeDto>>;


