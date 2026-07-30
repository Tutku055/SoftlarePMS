using MediatR;
using SoftPMS.Application.Common.Models;
using SoftPMS.Application.Features.Users.DTOs;

namespace SoftPMS.Application.Features.Users.Queries.GetUsersWithPagination;

public sealed record GetUsersWithPaginationQuery(
    int PageNumber,
    int PageSize,
    List<FilterCriteria>? Filters
) : IRequest<PaginatedList<UserDto>>;
