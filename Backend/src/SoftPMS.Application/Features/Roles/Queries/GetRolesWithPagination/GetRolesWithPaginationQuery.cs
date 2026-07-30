using SoftPMS.Application.Common.Models;
using SoftPMS.Application.Features.Roles.DTOs;
using MediatR;

namespace SoftPMS.Application.Features.Roles.Queries.GetRolesWithPagination;

public sealed record GetRolesWithPaginationQuery : IRequest<PaginatedList<RoleListDto>>
{
    public int PageNumber { get; init; } = 1;
    public int PageSize { get; init; } = 10;
    public string? SearchTerm { get; init; }
    public List<FilterCriteria>? Filters { get; init; }
}
