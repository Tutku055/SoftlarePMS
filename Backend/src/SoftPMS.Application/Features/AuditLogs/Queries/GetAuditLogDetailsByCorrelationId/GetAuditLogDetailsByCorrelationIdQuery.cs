using MediatR;
using SoftPMS.Application.Common.Models;
using SoftPMS.Application.Features.AuditLogs.DTOs;

namespace SoftPMS.Application.Features.AuditLogs.Queries.GetAuditLogDetailsByCorrelationId;

/// <summary>
/// CQRS Query to lazily fetch paginated sub-item audit log records belonging to a single transaction correlation ID.
/// </summary>
public sealed record GetAuditLogDetailsByCorrelationIdQuery(
    Guid CorrelationId,
    int PageNumber = 1,
    int PageSize = 20) : IRequest<PaginatedList<AuditLogItemDto>>;
