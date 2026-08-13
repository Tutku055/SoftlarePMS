using MediatR;
using SoftPMS.Application.Common.Models;
using SoftPMS.Application.Features.Professions.DTOs;

namespace SoftPMS.Application.Features.Professions.Queries.GetProfessionsWithPagination;

/// <summary>
/// Represents the Query to get professions with pagination.
/// </summary>
public sealed record GetProfessionsWithPaginationQuery : IRequest<PaginatedList<ProfessionDto>>
{
    public int PageNumber { get; init; } = 1;
    public int PageSize { get; init; } = 10;
    public string? SearchTerm { get; init; }
    public List<FilterCriteria>? Filters { get; init; }
}


