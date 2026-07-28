using SoftPMS.Application.Common.Models;
using SoftPMS.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;

namespace SoftPMS.Application.Common.Extensions;

public static class OvertimeTypeQueryExtensions
{
    public static IQueryable<OvertimeType> ApplyDynamicFilters(
        this IQueryable<OvertimeType> query,
        List<FilterCriteria>? filters)
    {
        if (filters == null || !filters.Any())
            return query;

        foreach (var filter in filters)
        {
            if (string.IsNullOrWhiteSpace(filter.Value))
                continue;

            var field = filter.Field.Trim();
            var op = filter.Operator?.ToLower().Trim();
            var val = filter.Value.Trim().ToLower();

            if (string.Equals(field, "name", StringComparison.OrdinalIgnoreCase))
            {
                query = op switch
                {
                    "equals" => query.Where(d => d.Name.ToLower() == val),
                    "contains" => query.Where(d => d.Name.ToLower().Contains(val)),
                    "startswith" => query.Where(d => d.Name.ToLower().StartsWith(val)),
                    "endswith" => query.Where(d => d.Name.ToLower().EndsWith(val)),
                    _ => query.Where(d => d.Name.ToLower().Contains(val))
                };
            }
            else if (string.Equals(field, "multiplier", StringComparison.OrdinalIgnoreCase))
            {
                if (decimal.TryParse(val, out var multiplier))
                {
                    query = op switch
                    {
                        "is" => query.Where(d => d.Multiplier == multiplier),
                        "morethan" => query.Where(d => d.Multiplier > multiplier),
                        "lessthan" => query.Where(d => d.Multiplier < multiplier),
                        _ => query.Where(d => d.Multiplier == multiplier)
                    };
                }
            }
            else if (string.Equals(field, "status", StringComparison.OrdinalIgnoreCase) || string.Equals(field, "isactive", StringComparison.OrdinalIgnoreCase))
            {
                bool isActive = val == "active" || val == "true" || val == "1";
                // IsActive means !IsDeleted
                query = op switch
                {
                    "is" => query.Where(d => !d.IsDeleted == isActive),
                    "isnot" => query.Where(d => !d.IsDeleted != isActive),
                    _ => query.Where(d => !d.IsDeleted == isActive)
                };
            }
            else if (string.Equals(field, "quickSearch", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(d => d.Name.ToLower().Contains(val));
            }
        }

        return query;
    }
}
