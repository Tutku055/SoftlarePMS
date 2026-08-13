using MediatR;
using SoftPMS.Application.Common.Models;
using SoftPMS.Application.Features.OvertimeTypes.DTOs;
using System.Collections.Generic;

namespace SoftPMS.Application.Features.OvertimeTypes.Queries.GetOvertimeTypesWithPagination;

/// <summary>
/// Represents the Query to get overtime types with pagination.
/// </summary>
public record GetOvertimeTypesWithPaginationQuery : IRequest<PaginatedList<OvertimeTypeDto>>
{
    public int PageNumber { get; init; } = 1;
    public int PageSize { get; init; } = 10;
    public string? SearchTerm { get; init; }
    public List<FilterCriteria>? Filters { get; init; }
}


