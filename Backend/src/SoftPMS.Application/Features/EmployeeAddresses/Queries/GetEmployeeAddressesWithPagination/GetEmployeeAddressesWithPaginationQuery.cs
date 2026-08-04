using MediatR;
using SoftPMS.Application.Common.Models;
using SoftPMS.Application.Features.EmployeeAddresses.DTOs;

namespace SoftPMS.Application.Features.EmployeeAddresses.Queries.GetEmployeeAddressesWithPagination;

public sealed record GetEmployeeAddressesWithPaginationQuery : IRequest<PaginatedList<EmployeeAddressDto>>
{
    public Guid? EmployeeId { get; init; }
    public int PageNumber { get; init; } = 1;
    public int PageSize { get; init; } = 10;
    public string? SearchTerm { get; init; }
    public List<FilterCriteria>? Filters { get; init; }
}
