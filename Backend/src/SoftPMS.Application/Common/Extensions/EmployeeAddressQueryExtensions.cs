using SoftPMS.Application.Common.Models;
using SoftPMS.Domain.Entities;
using System.Globalization;

namespace SoftPMS.Application.Common.Extensions;

public static class EmployeeAddressQueryExtensions
{
    public static IQueryable<EmployeeAddress> ApplyDynamicFilters(
        this IQueryable<EmployeeAddress> query,
        List<FilterCriteria>? filters)
    {
        if (filters == null || !filters.Any())
            return query;

        var today = DateTime.UtcNow.Date;

        foreach (var filter in filters)
        {
            if (string.IsNullOrWhiteSpace(filter.Value) && 
                filter.Operator != "isEmpty" && 
                filter.Operator != "isNotEmpty")
                continue;

            var field = filter.Field.Trim();
            var op = filter.Operator?.ToLower().Trim() ?? "contains";
            var val = (filter.Value ?? string.Empty).Trim().ToLower();

            if (string.Equals(field, "addressLine", StringComparison.OrdinalIgnoreCase))
            {
                query = op switch
                {
                    "equals" => query.Where(a => a.AddressLine.ToLower() == val),
                    "contains" => query.Where(a => a.AddressLine.ToLower().Contains(val)),
                    "startswith" => query.Where(a => a.AddressLine.ToLower().StartsWith(val)),
                    "endswith" => query.Where(a => a.AddressLine.ToLower().EndsWith(val)),
                    _ => query.Where(a => a.AddressLine.ToLower().Contains(val))
                };
            }
            else if (string.Equals(field, "city", StringComparison.OrdinalIgnoreCase))
            {
                var parts = val.Split(',', StringSplitOptions.RemoveEmptyEntries).Select(p => p.Trim()).ToList();
                if (parts.Count > 1)
                {
                    query = op switch
                    {
                        "in" or "is" or "equals" => query.Where(a => parts.Contains(a.City.ToLower())),
                        "notin" or "not in" or "not" => query.Where(a => !parts.Contains(a.City.ToLower())),
                        _ => query.Where(a => parts.Contains(a.City.ToLower()))
                    };
                }
                else
                {
                    query = op switch
                    {
                        "equals" => query.Where(a => a.City.ToLower() == val),
                        "contains" => query.Where(a => a.City.ToLower().Contains(val)),
                        "startswith" => query.Where(a => a.City.ToLower().StartsWith(val)),
                        "endswith" => query.Where(a => a.City.ToLower().EndsWith(val)),
                        _ => query.Where(a => a.City.ToLower().Contains(val))
                    };
                }
            }
            else if (string.Equals(field, "state", StringComparison.OrdinalIgnoreCase))
            {
                query = op switch
                {
                    "equals" => query.Where(a => a.State.ToLower() == val),
                    "contains" => query.Where(a => a.State.ToLower().Contains(val)),
                    "startswith" => query.Where(a => a.State.ToLower().StartsWith(val)),
                    "endswith" => query.Where(a => a.State.ToLower().EndsWith(val)),
                    _ => query.Where(a => a.State.ToLower().Contains(val))
                };
            }
            else if (string.Equals(field, "country", StringComparison.OrdinalIgnoreCase))
            {
                var parts = val.Split(',', StringSplitOptions.RemoveEmptyEntries).Select(p => p.Trim()).ToList();
                if (parts.Count > 1)
                {
                    query = op switch
                    {
                        "in" or "is" or "equals" => query.Where(a => parts.Contains(a.Country.ToLower())),
                        "notin" or "not in" or "not" => query.Where(a => !parts.Contains(a.Country.ToLower())),
                        _ => query.Where(a => parts.Contains(a.Country.ToLower()))
                    };
                }
                else
                {
                    query = op switch
                    {
                        "equals" => query.Where(a => a.Country.ToLower() == val),
                        "contains" => query.Where(a => a.Country.ToLower().Contains(val)),
                        "startswith" => query.Where(a => a.Country.ToLower().StartsWith(val)),
                        "endswith" => query.Where(a => a.Country.ToLower().EndsWith(val)),
                        _ => query.Where(a => a.Country.ToLower().Contains(val))
                    };
                }
            }
            else if (string.Equals(field, "postalCode", StringComparison.OrdinalIgnoreCase))
            {
                query = op switch
                {
                    "equals" => query.Where(a => a.PostalCode.ToLower() == val),
                    "contains" => query.Where(a => a.PostalCode.ToLower().Contains(val)),
                    "startswith" => query.Where(a => a.PostalCode.ToLower().StartsWith(val)),
                    "endswith" => query.Where(a => a.PostalCode.ToLower().EndsWith(val)),
                    _ => query.Where(a => a.PostalCode.ToLower().Contains(val))
                };
            }
            else if (string.Equals(field, "isPrimary", StringComparison.OrdinalIgnoreCase) ||
                     string.Equals(field, "primary", StringComparison.OrdinalIgnoreCase))
            {
                var isPrimaryVal = val is "true" or "1" or "yes" or "primary";
                query = op switch
                {
                    "is" or "equals" => query.Where(a => a.IsPrimary == isPrimaryVal),
                    "not" or "notequals" => query.Where(a => a.IsPrimary != isPrimaryVal),
                    _ => query.Where(a => a.IsPrimary == isPrimaryVal)
                };
            }
            else if (string.Equals(field, "status", StringComparison.OrdinalIgnoreCase) ||
                     string.Equals(field, "isCurrent", StringComparison.OrdinalIgnoreCase) ||
                     string.Equals(field, "active", StringComparison.OrdinalIgnoreCase))
            {
                if (val is "active" or "current" or "true" or "1")
                {
                    query = op switch
                    {
                        "is" or "equals" => query.Where(a => a.EndDate == null || a.EndDate >= today),
                        "not" => query.Where(a => a.EndDate != null && a.EndDate < today),
                        _ => query.Where(a => a.EndDate == null || a.EndDate >= today)
                    };
                }
                else if (val is "inactive" or "historical" or "past" or "false" or "0")
                {
                    query = op switch
                    {
                        "is" or "equals" => query.Where(a => a.EndDate != null && a.EndDate < today),
                        "not" => query.Where(a => a.EndDate == null || a.EndDate >= today),
                        _ => query.Where(a => a.EndDate != null && a.EndDate < today)
                    };
                }
            }
            else if (string.Equals(field, "startDate", StringComparison.OrdinalIgnoreCase))
            {
                if (DateTime.TryParse(filter.Value, CultureInfo.InvariantCulture, DateTimeStyles.None, out var dateVal) ||
                    DateTime.TryParse(filter.Value, out dateVal))
                {
                    var d = dateVal.Date;
                    query = op switch
                    {
                        "is" or "equals" => query.Where(a => a.StartDate.Date == d),
                        "after" or "isafter" => query.Where(a => a.StartDate.Date > d),
                        "before" or "isbefore" => query.Where(a => a.StartDate.Date < d),
                        "onorafter" => query.Where(a => a.StartDate.Date >= d),
                        "onorbefore" => query.Where(a => a.StartDate.Date <= d),
                        _ => query.Where(a => a.StartDate.Date == d)
                    };
                }
            }
            else if (string.Equals(field, "endDate", StringComparison.OrdinalIgnoreCase))
            {
                if (op is "isempty" or "isnull")
                {
                    query = query.Where(a => a.EndDate == null);
                }
                else if (op is "isnotempty" or "isnotnull")
                {
                    query = query.Where(a => a.EndDate != null);
                }
                else if (DateTime.TryParse(filter.Value, CultureInfo.InvariantCulture, DateTimeStyles.None, out var dateVal) ||
                         DateTime.TryParse(filter.Value, out dateVal))
                {
                    var d = dateVal.Date;
                    query = op switch
                    {
                        "is" or "equals" => query.Where(a => a.EndDate.HasValue && a.EndDate.Value.Date == d),
                        "after" or "isafter" => query.Where(a => a.EndDate.HasValue && a.EndDate.Value.Date > d),
                        "before" or "isbefore" => query.Where(a => a.EndDate.HasValue && a.EndDate.Value.Date < d),
                        "onorafter" => query.Where(a => a.EndDate.HasValue && a.EndDate.Value.Date >= d),
                        "onorbefore" => query.Where(a => a.EndDate.HasValue && a.EndDate.Value.Date <= d),
                        _ => query.Where(a => a.EndDate.HasValue && a.EndDate.Value.Date == d)
                    };
                }
            }
            else if (string.Equals(field, "employeeId", StringComparison.OrdinalIgnoreCase))
            {
                var parts = val.Split(',', StringSplitOptions.RemoveEmptyEntries)
                               .Select(p => Guid.TryParse(p.Trim(), out var g) ? g : Guid.Empty)
                               .Where(g => g != Guid.Empty)
                               .ToList();

                if (parts.Count > 1)
                {
                    query = op switch
                    {
                        "in" or "is" or "equals" => query.Where(a => parts.Contains(a.EmployeeId)),
                        "notin" or "not in" or "not" => query.Where(a => !parts.Contains(a.EmployeeId)),
                        _ => query.Where(a => parts.Contains(a.EmployeeId))
                    };
                }
                else if (parts.Count == 1)
                {
                    var g = parts[0];
                    query = op switch
                    {
                        "is" or "equals" => query.Where(a => a.EmployeeId == g),
                        "not" or "notequals" => query.Where(a => a.EmployeeId != g),
                        _ => query.Where(a => a.EmployeeId == g)
                    };
                }
            }
            else if (string.Equals(field, "quickSearch", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(a =>
                    a.AddressLine.ToLower().Contains(val) ||
                    a.City.ToLower().Contains(val) ||
                    a.State.ToLower().Contains(val) ||
                    a.Country.ToLower().Contains(val) ||
                    a.PostalCode.ToLower().Contains(val));
            }
        }

        return query;
    }
}
