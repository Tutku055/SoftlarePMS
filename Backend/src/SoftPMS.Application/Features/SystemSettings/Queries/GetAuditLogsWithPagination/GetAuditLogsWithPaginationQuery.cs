using MediatR;
using SoftPMS.Application.Common.Models;
using SoftPMS.Application.Features.SystemSettings.DTOs;

namespace SoftPMS.Application.Features.SystemSettings.Queries.GetAuditLogsWithPagination;

/// <summary>
/// CQRS Query for retrieving paginated audit logs with parsed JSON change deltas
/// and dynamic entity existence status.
/// </summary>
public sealed record GetAuditLogsWithPaginationQuery(
    int PageNumber = 1,
    int PageSize = 10,
    string? SearchTerm = null,
    string? TableName = null,
    string? Action = null
) : IRequest<PaginatedList<AuditLogDto>>;
