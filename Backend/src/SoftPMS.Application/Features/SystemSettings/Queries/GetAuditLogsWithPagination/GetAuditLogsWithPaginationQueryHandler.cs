using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata;
using SoftPMS.Application.Common.Interfaces;
using SoftPMS.Application.Common.Models;
using SoftPMS.Application.Features.SystemSettings.DTOs;
using SoftPMS.Application.Features.SystemSettings.Helpers;

namespace SoftPMS.Application.Features.SystemSettings.Queries.GetAuditLogsWithPagination;

public sealed class GetAuditLogsWithPaginationQueryHandler(
    IApplicationDbContext context)
    : IRequestHandler<GetAuditLogsWithPaginationQuery, PaginatedList<AuditLogDto>>
{
    public async Task<PaginatedList<AuditLogDto>> Handle(
        GetAuditLogsWithPaginationQuery request,
        CancellationToken cancellationToken)
    {
        var query = context.AuditLogs.AsNoTracking();

        // 1. Optional Filtering
        if (!string.IsNullOrWhiteSpace(request.SearchTerm))
        {
            var term = request.SearchTerm.Trim();
            query = query.Where(a =>
                a.TableName.Contains(term) ||
                a.RecordId.Contains(term) ||
                a.Action.Contains(term) ||
                a.ChangedByEmail.Contains(term));
        }

        if (!string.IsNullOrWhiteSpace(request.TableName))
        {
            var table = request.TableName.Trim();
            query = query.Where(a => a.TableName == table);
        }

        if (!string.IsNullOrWhiteSpace(request.Action))
        {
            var act = request.Action.Trim();
            query = query.Where(a => a.Action == act);
        }

        // 2. Correlation-Level Grouping & Ordering
        var groupQuery = query
            .GroupBy(a => a.CorrelationId)
            .Select(g => new
            {
                CorrelationId = g.Key,
                MaxChangedAt = g.Max(a => a.ChangedAt),
                MaxId = g.Max(a => a.Id),
                ItemCount = g.Count()
            })
            .OrderByDescending(g => g.MaxChangedAt)
            .ThenByDescending(g => g.MaxId);

        var totalCount = await groupQuery.CountAsync(cancellationToken);

        if (totalCount == 0)
        {
            return new PaginatedList<AuditLogDto>(
                [],
                0,
                request.PageNumber,
                request.PageSize);
        }

        // 3. Paginated Group Keys Fetch
        var pagedGroups = await groupQuery
            .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToListAsync(cancellationToken);

        var singleItemCorrelationIds = pagedGroups.Where(g => g.ItemCount == 1).Select(g => g.CorrelationId).ToList();
        var bulkCorrelationIds = pagedGroups.Where(g => g.ItemCount > 1).Select(g => g.CorrelationId).ToList();

        var dbContext = context as DbContext;
        var existenceCache = new Dictionary<string, bool>(StringComparer.OrdinalIgnoreCase);
        var entityTypeCache = new Dictionary<string, IEntityType?>(StringComparer.OrdinalIgnoreCase);

        // 4. Handle Single-Item Transactions (load changes eagerly for instant accordion display)
        var singleDtosByCorrelation = new Dictionary<Guid, AuditLogDto>();

        if (singleItemCorrelationIds.Count > 0)
        {
            var singleLogs = await context.AuditLogs.AsNoTracking()
                .Where(a => singleItemCorrelationIds.Contains(a.CorrelationId))
                .ToListAsync(cancellationToken);

            var singleItems = new List<AuditLogItemDto>(singleLogs.Count);
            var singleLogMap = new Dictionary<Guid, Domain.Entities.AuditLog>();

            foreach (var log in singleLogs)
            {
                singleLogMap[log.CorrelationId] = log;
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

                singleItems.Add(new AuditLogItemDto
                {
                    Id = log.Id,
                    TableName = log.TableName,
                    RecordId = log.RecordId ?? string.Empty,
                    Action = log.Action,
                    IsEntityActive = isEntityActive,
                    Changes = parsedChanges
                });
            }

            await AuditLogHelper.ResolveHumanReadableNamesAsync(singleItems, context, cancellationToken);
            await AuditLogHelper.ResolveNavigationRoutesAsync(singleItems, context, cancellationToken);

            foreach (var item in singleItems)
            {
                var originalLog = singleLogs.First(l => l.Id == item.Id);
                var actionType = (item.Action ?? string.Empty).ToLowerInvariant() switch
                {
                    "created" => "created",
                    "deleted" => "deleted",
                    _ => "modified"
                };

                singleDtosByCorrelation[originalLog.CorrelationId] = new AuditLogDto
                {
                    Id = originalLog.Id,
                    CorrelationId = originalLog.CorrelationId,
                    TableName = item.TableName,
                    RecordId = item.RecordId,
                    Action = item.Action,
                    ActionType = actionType,
                    ItemCount = 1,
                    ChangedByUserId = originalLog.ChangedByUserId,
                    ChangedByEmail = string.IsNullOrWhiteSpace(originalLog.ChangedByEmail) ? "System" : originalLog.ChangedByEmail,
                    ChangedAt = originalLog.ChangedAt,
                    IsEntityActive = item.IsEntityActive,
                    TotalChangesCount = item.Changes.Count,
                    EntityTitle = item.EntityTitle,
                    Changes = item.Changes,
                    NavigationRoute = item.NavigationRoute,
                    Items = [item]
                };
            }
        }

        // 5. Handle Multi-Item Bulk Transactions (lightweight summary metadata only, no heavy JSON/diff payload)
        var bulkDtosByCorrelation = new Dictionary<Guid, AuditLogDto>();

        if (bulkCorrelationIds.Count > 0)
        {
            var bulkSummaries = await context.AuditLogs.AsNoTracking()
                .Where(a => bulkCorrelationIds.Contains(a.CorrelationId))
                .Select(a => new
                {
                    a.Id,
                    a.CorrelationId,
                    a.TableName,
                    a.RecordId,
                    a.Action,
                    a.ChangedByEmail,
                    a.ChangedByUserId,
                    a.ChangedAt
                })
                .OrderByDescending(a => a.Id)
                .ToListAsync(cancellationToken);

            var bulkSummariesByCorrelation = bulkSummaries.GroupBy(s => s.CorrelationId);

            foreach (var bulkGroup in bulkSummariesByCorrelation)
            {
                var corrId = bulkGroup.Key;
                var groupMeta = pagedGroups.First(g => g.CorrelationId == corrId);
                var itemsList = bulkGroup.ToList();
                var first = itemsList[0];

                var distinctTables = itemsList.Select(i => i.TableName).Distinct(StringComparer.OrdinalIgnoreCase).ToList();
                var summaryTableName = string.Join(", ", distinctTables);

                var itemCount = groupMeta.ItemCount;
                var summaryRecordId = $"{itemCount} records";

                var actions = itemsList.Select(i => (i.Action ?? string.Empty).ToLowerInvariant()).ToList();
                var allCreated = actions.All(a => a == "created");
                var allDeleted = actions.All(a => a == "deleted");
                var allModified = actions.All(a => a == "modified");

                string actionLabel;
                string actionType;

                if (allCreated)
                {
                    actionLabel = $"Created ({itemCount} items)";
                    actionType = "created";
                }
                else if (allDeleted)
                {
                    actionLabel = $"Deleted ({itemCount} items)";
                    actionType = "deleted";
                }
                else if (allModified)
                {
                    actionLabel = $"Modified ({itemCount} items)";
                    actionType = "modified";
                }
                else
                {
                    actionLabel = $"Updated ({itemCount} changes)";
                    actionType = "updated";
                }

                string? bulkNavigationRoute = null;
                if (distinctTables.All(t => t.Contains("timesheet", StringComparison.OrdinalIgnoreCase)))
                {
                    bulkNavigationRoute = "/finance/timesheets";
                }
                else if (distinctTables.All(t => t.Contains("payroll", StringComparison.OrdinalIgnoreCase)))
                {
                    bulkNavigationRoute = "/finance/payrolls";
                }
                else if (distinctTables.All(t => t.Contains("employee", StringComparison.OrdinalIgnoreCase)))
                {
                    bulkNavigationRoute = "/employees";
                }
                else if (distinctTables.All(t => t.Contains("department", StringComparison.OrdinalIgnoreCase)))
                {
                    bulkNavigationRoute = "/departments";
                }
                else if (distinctTables.All(t => t.Contains("role", StringComparison.OrdinalIgnoreCase)))
                {
                    bulkNavigationRoute = "/settings/roles";
                }
                else if (distinctTables.All(t => t.Contains("user", StringComparison.OrdinalIgnoreCase)))
                {
                    bulkNavigationRoute = "/settings/users";
                }
                else if (distinctTables.All(t => t.Contains("document", StringComparison.OrdinalIgnoreCase)))
                {
                    bulkNavigationRoute = "/documents";
                }

                bulkDtosByCorrelation[corrId] = new AuditLogDto
                {
                    Id = first.Id,
                    CorrelationId = corrId,
                    TableName = summaryTableName,
                    RecordId = summaryRecordId,
                    Action = actionLabel,
                    ActionType = actionType,
                    ItemCount = itemCount,
                    ChangedByUserId = first.ChangedByUserId,
                    ChangedByEmail = string.IsNullOrWhiteSpace(first.ChangedByEmail) ? "System" : first.ChangedByEmail,
                    ChangedAt = first.ChangedAt,
                    IsEntityActive = true,
                    TotalChangesCount = 0,
                    EntityTitle = $"{AuditLogEnricher.FormatTableName(summaryTableName)} ({itemCount} items)",
                    Changes = [],
                    NavigationRoute = bulkNavigationRoute,
                    Items = [] // Empty for bulk list payload; loaded lazily via sub-query on demand
                };
            }
        }

        // 6. Build the ordered response DTO list
        var dtos = new List<AuditLogDto>(pagedGroups.Count);
        foreach (var group in pagedGroups)
        {
            if (singleDtosByCorrelation.TryGetValue(group.CorrelationId, out var singleDto))
            {
                dtos.Add(singleDto);
            }
            else if (bulkDtosByCorrelation.TryGetValue(group.CorrelationId, out var bulkDto))
            {
                dtos.Add(bulkDto);
            }
        }

        return new PaginatedList<AuditLogDto>(
            dtos,
            totalCount,
            request.PageNumber,
            request.PageSize);
    }
}
