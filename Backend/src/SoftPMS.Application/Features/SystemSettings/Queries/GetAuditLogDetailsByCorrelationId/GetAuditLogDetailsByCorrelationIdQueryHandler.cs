using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata;
using SoftPMS.Application.Common.Interfaces;
using SoftPMS.Application.Common.Models;
using SoftPMS.Application.Features.SystemSettings.DTOs;
using SoftPMS.Application.Features.SystemSettings.Helpers;

namespace SoftPMS.Application.Features.SystemSettings.Queries.GetAuditLogDetailsByCorrelationId;

public sealed class GetAuditLogDetailsByCorrelationIdQueryHandler(
    IApplicationDbContext context)
    : IRequestHandler<GetAuditLogDetailsByCorrelationIdQuery, PaginatedList<AuditLogItemDto>>
{
    public async Task<PaginatedList<AuditLogItemDto>> Handle(
        GetAuditLogDetailsByCorrelationIdQuery request,
        CancellationToken cancellationToken)
    {
        var baseQuery = context.AuditLogs.AsNoTracking()
            .Where(a => a.CorrelationId == request.CorrelationId);

        var totalCount = await baseQuery.CountAsync(cancellationToken);

        if (totalCount == 0)
        {
            return new PaginatedList<AuditLogItemDto>(
                [],
                0,
                request.PageNumber,
                request.PageSize);
        }

        var pagedLogs = await baseQuery
            .OrderByDescending(a => a.ChangedAt)
            .ThenByDescending(a => a.Id)
            .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToListAsync(cancellationToken);

        var dbContext = context as DbContext;
        var existenceCache = new Dictionary<string, bool>(StringComparer.OrdinalIgnoreCase);
        var entityTypeCache = new Dictionary<string, IEntityType?>(StringComparer.OrdinalIgnoreCase);

        var items = new List<AuditLogItemDto>(pagedLogs.Count);

        foreach (var log in pagedLogs)
        {
            var isEntityActive = false;
            IEntityType? entityType = null;

            if (dbContext != null)
            {
                var cacheKey = $"{log.TableName}:{log.RecordId}";
                if (!existenceCache.TryGetValue(cacheKey, out isEntityActive))
                {
                    isEntityActive = await AuditLogHelper.CheckEntityExistsAsync(
                        dbContext,
                        log.TableName,
                        log.RecordId ?? string.Empty,
                        cancellationToken);

                    existenceCache[cacheKey] = isEntityActive;
                }

                if (!entityTypeCache.TryGetValue(log.TableName, out entityType))
                {
                    entityType = AuditLogHelper.FindEntityType(dbContext, log.TableName);
                    entityTypeCache[log.TableName] = entityType;
                }
            }

            var parsedChanges = AuditLogHelper.ParseChanges(log.OldValues, log.NewValues, entityType);

            items.Add(new AuditLogItemDto
            {
                Id = log.Id,
                TableName = log.TableName,
                RecordId = log.RecordId ?? string.Empty,
                Action = log.Action,
                IsEntityActive = isEntityActive,
                Changes = parsedChanges
            });
        }

        // Batch resolve human readable foreign key names and exact entity navigation routes
        await AuditLogHelper.ResolveHumanReadableNamesAsync(items, context, cancellationToken);
        await AuditLogHelper.ResolveNavigationRoutesAsync(items, context, cancellationToken);

        return new PaginatedList<AuditLogItemDto>(
            items,
            totalCount,
            request.PageNumber,
            request.PageSize);
    }
}
