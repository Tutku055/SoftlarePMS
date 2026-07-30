using SoftPMS.Application.Common.Models;
using SoftPMS.Domain.Entities;

namespace SoftPMS.Application.Common.Extensions;

public static class ProfessionQueryExtensions
{
    public static IQueryable<Profession> ApplyDynamicFilters(
        this IQueryable<Profession> query,
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
                    "equals" => query.Where(p => p.Name.ToLower() == val),
                    "contains" => query.Where(p => p.Name.ToLower().Contains(val)),
                    "startswith" => query.Where(p => p.Name.ToLower().StartsWith(val)),
                    "endswith" => query.Where(p => p.Name.ToLower().EndsWith(val)),
                    _ => query.Where(p => p.Name.ToLower().Contains(val))
                };
            }
            else if (string.Equals(field, "description", StringComparison.OrdinalIgnoreCase))
            {
                query = op switch
                {
                    "equals" => query.Where(p => p.Description != null && p.Description.ToLower() == val),
                    "contains" => query.Where(p => p.Description != null && p.Description.ToLower().Contains(val)),
                    "startswith" => query.Where(p => p.Description != null && p.Description.ToLower().StartsWith(val)),
                    "endswith" => query.Where(p => p.Description != null && p.Description.ToLower().EndsWith(val)),
                    _ => query.Where(p => p.Description != null && p.Description.ToLower().Contains(val))
                };
            }
            else if (string.Equals(field, "status", StringComparison.OrdinalIgnoreCase))
            {
                if (val == "active")
                {
                    query = op switch
                    {
                        "is" => query.Where(p => p.IsActive),
                        "not" => query.Where(p => !p.IsActive),
                        _ => query.Where(p => p.IsActive)
                    };
                }
                else if (val == "inactive")
                {
                    query = op switch
                    {
                        "is" => query.Where(p => !p.IsActive),
                        "not" => query.Where(p => p.IsActive),
                        _ => query.Where(p => !p.IsActive)
                    };
                }
            }
            else if (string.Equals(field, "quickSearch", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(p => p.Name.ToLower().Contains(val));
            }
        }

        return query;
    }
}
