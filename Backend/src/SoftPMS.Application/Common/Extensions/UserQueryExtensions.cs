using SoftPMS.Application.Common.Models;
using SoftPMS.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;

namespace SoftPMS.Application.Common.Extensions;

public static class UserQueryExtensions
{
    public static IQueryable<User> ApplyDynamicFilters(
        this IQueryable<User> query,
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

            if (string.Equals(field, "employeeId", StringComparison.OrdinalIgnoreCase))
            {
                query = op switch
                {
                    "equals" or "is" => query.Where(u => (u.EmployeeId != null && u.EmployeeId.ToString()!.ToLower() == val) ||
                                                        (u.Employee != null && u.Employee.EmployeeNo.ToLower() == val)),
                    "contains" => query.Where(u => (u.EmployeeId != null && u.EmployeeId.ToString()!.ToLower().Contains(val)) ||
                                                   (u.Employee != null && u.Employee.EmployeeNo.ToLower().Contains(val))),
                    "startswith" => query.Where(u => (u.EmployeeId != null && u.EmployeeId.ToString()!.ToLower().StartsWith(val)) ||
                                                     (u.Employee != null && u.Employee.EmployeeNo.ToLower().StartsWith(val))),
                    "endswith" => query.Where(u => (u.EmployeeId != null && u.EmployeeId.ToString()!.ToLower().EndsWith(val)) ||
                                                   (u.Employee != null && u.Employee.EmployeeNo.ToLower().EndsWith(val))),
                    _ => query.Where(u => (u.EmployeeId != null && u.EmployeeId.ToString()!.ToLower().Contains(val)) ||
                                          (u.Employee != null && u.Employee.EmployeeNo.ToLower().Contains(val)))
                };
            }
            else if (string.Equals(field, "username", StringComparison.OrdinalIgnoreCase))
            {
                query = op switch
                {
                    "equals" or "is" => query.Where(u => u.Username.ToLower() == val),
                    "contains" => query.Where(u => u.Username.ToLower().Contains(val)),
                    "startswith" => query.Where(u => u.Username.ToLower().StartsWith(val)),
                    "endswith" => query.Where(u => u.Username.ToLower().EndsWith(val)),
                    _ => query.Where(u => u.Username.ToLower().Contains(val))
                };
            }
            else if (string.Equals(field, "email", StringComparison.OrdinalIgnoreCase))
            {
                query = op switch
                {
                    "equals" or "is" => query.Where(u => u.Email.ToLower() == val),
                    "contains" => query.Where(u => u.Email.ToLower().Contains(val)),
                    "startswith" => query.Where(u => u.Email.ToLower().StartsWith(val)),
                    "endswith" => query.Where(u => u.Email.ToLower().EndsWith(val)),
                    _ => query.Where(u => u.Email.ToLower().Contains(val))
                };
            }
            else if (string.Equals(field, "fullName", StringComparison.OrdinalIgnoreCase) || 
                     string.Equals(field, "employeeName", StringComparison.OrdinalIgnoreCase))
            {
                query = op switch
                {
                    "firstname" => query.Where(u => u.Employee != null && u.Employee.FirstName.ToLower().Contains(val)),
                    "lastname" => query.Where(u => u.Employee != null && u.Employee.LastName.ToLower().Contains(val)),
                    "equals" => query.Where(u => u.Employee != null && (u.Employee.FirstName + " " + u.Employee.LastName).ToLower() == val),
                    "startswith" => query.Where(u => u.Employee != null && (u.Employee.FirstName + " " + u.Employee.LastName).ToLower().StartsWith(val)),
                    "endswith" => query.Where(u => u.Employee != null && (u.Employee.FirstName + " " + u.Employee.LastName).ToLower().EndsWith(val)),
                    _ => query.Where(u => u.Employee != null && (u.Employee.FirstName + " " + u.Employee.LastName).ToLower().Contains(val))
                };
            }
            else if (string.Equals(field, "isActive", StringComparison.OrdinalIgnoreCase))
            {
                bool targetStatus = val switch
                {
                    "1" or "true" or "active" => true,
                    "0" or "false" or "inactive" => false,
                    _ => bool.TryParse(val, out var parsed) ? parsed : true
                };

                query = op switch
                {
                    "is" or "equals" => query.Where(u => u.IsActive == targetStatus),
                    "not" => query.Where(u => u.IsActive != targetStatus),
                    _ => query.Where(u => u.IsActive == targetStatus)
                };
            }
            else if (string.Equals(field, "role", StringComparison.OrdinalIgnoreCase))
            {
                query = op switch
                {
                    "is" or "equals" => query.Where(u => u.Role != null && u.Role.Name.ToLower() == val),
                    "not" => query.Where(u => u.Role == null || u.Role.Name.ToLower() != val),
                    _ => query.Where(u => u.Role != null && u.Role.Name.ToLower() == val)
                };
            }
            else if (string.Equals(field, "quickSearch", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(u => u.Username.ToLower().Contains(val) ||
                                         u.Email.ToLower().Contains(val) ||
                                         (u.EmployeeId != null && u.EmployeeId.ToString()!.ToLower().Contains(val)));
            }
        }

        return query;
    }
}
