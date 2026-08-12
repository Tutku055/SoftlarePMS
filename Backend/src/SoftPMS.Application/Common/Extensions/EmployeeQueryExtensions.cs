using SoftPMS.Application.Common.Models;
using SoftPMS.Domain.Entities;
using SoftPMS.Domain.Enums;
using System;
using System.Collections.Generic;
using System.Linq;

namespace SoftPMS.Application.Common.Extensions;

public static class EmployeeQueryExtensions
{
    public static IQueryable<Employee> ApplyDynamicFilters(
        this IQueryable<Employee> query,
        List<FilterCriteria>? filters)
    {
        if (filters == null || !filters.Any())
            return query;

        foreach (var filter in filters)
        {
            if (string.IsNullOrWhiteSpace(filter.Value))
                continue;

            // Convert field name to lowercase (frontend might send camelCase: firstName)
            var field = filter.Field.Trim();
            // Convert operator to lowercase (MUI sends "contains", "equals")
            var op = filter.Operator?.ToLower().Trim();
            var val = filter.Value.Trim().ToLower();

            // Each if/case block chains query.Where(...) filters
            if (string.Equals(field, "employeeNo", StringComparison.OrdinalIgnoreCase))
            {
                query = op switch
                {
                    "equals" => query.Where(e => e.EmployeeNo.ToLower() == val),
                    "contains" => query.Where(e => e.EmployeeNo.ToLower().Contains(val)),
                    "startswith" => query.Where(e => e.EmployeeNo.ToLower().StartsWith(val)),
                    "endswith" => query.Where(e => e.EmployeeNo.ToLower().EndsWith(val)),
                    _ => query.Where(e => e.EmployeeNo.ToLower().Contains(val)) // Default fallback
                };
            }
            else if (string.Equals(field, "firstName", StringComparison.OrdinalIgnoreCase))
            {
                query = op switch
                {
                    "equals" => query.Where(e => e.FirstName.ToLower() == val),
                    "contains" => query.Where(e => e.FirstName.ToLower().Contains(val)),
                    "startswith" => query.Where(e => e.FirstName.ToLower().StartsWith(val)),
                    "endswith" => query.Where(e => e.FirstName.ToLower().EndsWith(val)),
                    _ => query.Where(e => e.FirstName.ToLower().Contains(val))
                };
            }
            else if (string.Equals(field, "lastName", StringComparison.OrdinalIgnoreCase))
            {
                query = op switch
                {
                    "equals" => query.Where(e => e.LastName.ToLower() == val),
                    "contains" => query.Where(e => e.LastName.ToLower().Contains(val)),
                    "startswith" => query.Where(e => e.LastName.ToLower().StartsWith(val)),
                    "endswith" => query.Where(e => e.LastName.ToLower().EndsWith(val)),
                    _ => query.Where(e => e.LastName.ToLower().Contains(val))
                };
            }
            else if (string.Equals(field, "fullName", StringComparison.OrdinalIgnoreCase))
            {
                query = op switch
                {
                    "firstname" => query.Where(e => e.FirstName.ToLower().Contains(val)),
                    "lastname" => query.Where(e => e.LastName.ToLower().Contains(val)),
                    "equals" => query.Where(e => (e.FirstName + " " + e.LastName).ToLower() == val),
                    "startswith" => query.Where(e => (e.FirstName + " " + e.LastName).ToLower().StartsWith(val)),
                    "endswith" => query.Where(e => (e.FirstName + " " + e.LastName).ToLower().EndsWith(val)),
                    _ => query.Where(e => (e.FirstName + " " + e.LastName).ToLower().Contains(val))
                };
            }

            else if (string.Equals(field, "profession", StringComparison.OrdinalIgnoreCase) ||
                     string.Equals(field, "professionId", StringComparison.OrdinalIgnoreCase))
            {
                var parts = val.Split(',', StringSplitOptions.RemoveEmptyEntries)
                               .Select(p => p.Trim())
                               .Where(p => !string.IsNullOrEmpty(p))
                               .ToList();

                if (parts.Any())
                {
                    var guids = parts.Select(p => Guid.TryParse(p, out var g) ? g : Guid.Empty)
                                     .Where(g => g != Guid.Empty)
                                     .ToList();

                    var namesLower = parts.Where(p => !Guid.TryParse(p, out _))
                                          .Select(p => p.ToLower())
                                          .ToList();

                    if (guids.Any() && namesLower.Any())
                    {
                        query = op switch
                        {
                            "in" or "is" or "equals" => query.Where(e => (e.ProfessionId.HasValue && guids.Contains(e.ProfessionId.Value)) ||
                                                                         (e.Profession != null && namesLower.Contains(e.Profession.Name.ToLower()))),
                            "notin" or "not in" or "not" => query.Where(e => (!e.ProfessionId.HasValue || !guids.Contains(e.ProfessionId.Value)) &&
                                                                             (e.Profession == null || !namesLower.Contains(e.Profession.Name.ToLower()))),
                            _ => query.Where(e => (e.ProfessionId.HasValue && guids.Contains(e.ProfessionId.Value)) ||
                                                  (e.Profession != null && namesLower.Contains(e.Profession.Name.ToLower())))
                        };
                    }
                    else if (guids.Any())
                    {
                        query = op switch
                        {
                            "in" or "is" or "equals" => query.Where(e => e.ProfessionId.HasValue && guids.Contains(e.ProfessionId.Value)),
                            "notin" or "not in" or "not" => query.Where(e => !e.ProfessionId.HasValue || !guids.Contains(e.ProfessionId.Value)),
                            _ => query.Where(e => e.ProfessionId.HasValue && guids.Contains(e.ProfessionId.Value))
                        };
                    }
                    else
                    {
                        query = op switch
                        {
                            "in" or "is" or "equals" => query.Where(e => e.Profession != null && namesLower.Contains(e.Profession.Name.ToLower())),
                            "notin" or "not in" or "not" => query.Where(e => e.Profession == null || !namesLower.Contains(e.Profession.Name.ToLower())),
                            "contains" => query.Where(e => e.Profession != null && namesLower.Any(n => e.Profession.Name.ToLower().Contains(n))),
                            _ => query.Where(e => e.Profession != null && namesLower.Contains(e.Profession.Name.ToLower()))
                        };
                    }
                }
            }
            else if (string.Equals(field, "employmentStatus", StringComparison.OrdinalIgnoreCase))
            {
                if (Enum.TryParse<EmploymentStatus>(filter.Value, out var status))
                {
                    query = op switch
                    {
                        "is" => query.Where(e => e.EmploymentStatus == status),
                        "not" => query.Where(e => e.EmploymentStatus != status),
                        _ => query.Where(e => e.EmploymentStatus == status)
                    };
                }
            }
            else if (string.Equals(field, "hireDate", StringComparison.OrdinalIgnoreCase))
            {
                if (DateTime.TryParse(filter.Value, out var date))
                {
                    var targetDate = date.Date;
                    query = op switch
                    {
                        "is" => query.Where(e => e.HireDate.Date == targetDate),
                        "after" => query.Where(e => e.HireDate.Date > targetDate),
                        "before" => query.Where(e => e.HireDate.Date < targetDate),
                        _ => query.Where(e => e.HireDate.Date == targetDate)
                    };
                }
            }
            else if (string.Equals(field, "quickSearch", StringComparison.OrdinalIgnoreCase))
            {
                // Quick search uses OR logic across multiple fields
                query = query.Where(e => e.FirstName.ToLower().Contains(val) ||
                                         e.LastName.ToLower().Contains(val) ||
                                         e.EmployeeNo.ToLower().Contains(val));
            }
            else if (string.Equals(field, "departmentId", StringComparison.OrdinalIgnoreCase))
            {
                var ids = val.Split(',', StringSplitOptions.RemoveEmptyEntries)
                             .Select(idStr => Guid.TryParse(idStr.Trim(), out var parsed) ? parsed : Guid.Empty)
                             .Where(g => g != Guid.Empty)
                             .ToList();

                if (ids.Any())
                {
                    query = op switch
                    {
                        "in" => query.Where(e => e.DepartmentId.HasValue && ids.Contains(e.DepartmentId.Value)),
                        "notin" or "not in" => query.Where(e => !e.DepartmentId.HasValue || !ids.Contains(e.DepartmentId.Value)),
                        _ => query.Where(e => e.DepartmentId.HasValue && ids.Contains(e.DepartmentId.Value))
                    };
                }
            }
        }

        return query;
    }
}