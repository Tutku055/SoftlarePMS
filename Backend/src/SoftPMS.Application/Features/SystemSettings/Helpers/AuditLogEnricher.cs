using System.Globalization;
using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using SoftPMS.Application.Common.Interfaces;
using SoftPMS.Application.Features.SystemSettings.DTOs;
using SoftPMS.Domain.Enums;

namespace SoftPMS.Application.Features.SystemSettings.Helpers;

/// <summary>
/// Domain-aware enrichment service for AuditLog DTOs.
/// Enforces property blacklisting, foreign key name resolution,
/// context-aware header title generation (EntityTitle), and navigation route resolution.
/// </summary>
public static class AuditLogEnricher
{
    /// <summary>
    /// System and metadata keys that must never be exposed to the property diff viewer.
    /// </summary>
    private static readonly HashSet<string> BlacklistedProperties = new(StringComparer.OrdinalIgnoreCase)
    {
        "Id",
        "CreatedAt",
        "CreatedByUserId",
        "ChangedAt",
        "ChangedByEmail",
        "ChangedByUser",
        "CorrelationId",
        "IsDeleted",
        "IsSystemRole",
        "IsSystemUser",
        "RefreshToken",
        "RefreshTokenExpiryTime",
        "PasswordHash",
        "RowVersion"
    };

    /// <summary>
    /// Checks if a given property name is in the blacklisted metadata filter.
    /// </summary>
    public static bool IsBlacklisted(string propertyName)
    {
        if (string.IsNullOrWhiteSpace(propertyName))
            return true;

        return BlacklistedProperties.Contains(propertyName.Trim());
    }

    /// <summary>
    /// Enriches a collection of AuditLogItemDto records in a single batched database pass:
    /// 1. Filters out blacklisted properties from Changes.
    /// 2. Resolves Foreign Key GUIDs into human-readable names.
    /// 3. Generates context-aware EntityTitle headers based on entity relationships.
    /// 4. Generates direct application NavigationRoutes.
    /// </summary>
    public static async Task EnrichAsync(
        List<AuditLogItemDto> items,
        IApplicationDbContext context,
        CancellationToken cancellationToken)
    {
        if (items.Count == 0)
            return;

        // ── 1. Property Blacklisting ──────────────────────────────────────────
        foreach (var item in items)
        {
            if (item.Changes.Count > 0)
            {
                item.Changes.RemoveAll(c => IsBlacklisted(c.PropertyName));
            }
        }

        // ── 2. Collect all Entity & Foreign Key IDs (Single Pass) ─────────────
        var employeeIds = new HashSet<Guid>();
        var departmentIds = new HashSet<Guid>();
        var professionIds = new HashSet<Guid>();
        var roleIds = new HashSet<Guid>();
        var permissionIds = new HashSet<Guid>();
        var overtimeTypeIds = new HashSet<Guid>();
        var userIds = new HashSet<Guid>();
        var monthlyTimesheetIds = new HashSet<Guid>();
        var timesheetEntryIds = new HashSet<Guid>();
        var payrollSlipIds = new HashSet<Guid>();
        var payrollSlipLineItemIds = new HashSet<Guid>();
        var documentIds = new HashSet<Guid>();
        var rolloverLogIds = new HashSet<Guid>();

        foreach (var item in items)
        {
            var table = (item.TableName ?? string.Empty).Trim().ToLowerInvariant();
            var hasRecordGuid = Guid.TryParse(item.RecordId, out var recordGuid) && recordGuid != Guid.Empty;

            // Collect IDs from RecordId
            if (hasRecordGuid)
            {
                switch (table)
                {
                    case "employees" or "employee":
                        employeeIds.Add(recordGuid);
                        break;
                    case "departments" or "department":
                        departmentIds.Add(recordGuid);
                        break;
                    case "professions" or "profession":
                        professionIds.Add(recordGuid);
                        break;
                    case "roles" or "role":
                        roleIds.Add(recordGuid);
                        break;
                    case "permissions" or "permission":
                        permissionIds.Add(recordGuid);
                        break;
                    case "overtimetypes" or "overtimetype":
                        overtimeTypeIds.Add(recordGuid);
                        break;
                    case "users" or "user":
                        userIds.Add(recordGuid);
                        break;
                    case "monthlytimesheets" or "monthlytimesheet":
                        monthlyTimesheetIds.Add(recordGuid);
                        break;
                    case "timesheetentries" or "timesheetentry":
                        timesheetEntryIds.Add(recordGuid);
                        break;
                    case "payrollslips" or "payrollslip":
                        payrollSlipIds.Add(recordGuid);
                        break;
                    case "payrollsliplineitems" or "payrollsliplineitem":
                        payrollSlipLineItemIds.Add(recordGuid);
                        break;
                    case "documents" or "document":
                        documentIds.Add(recordGuid);
                        break;
                    case "yearlyrolloverlogs" or "yearlyrolloverlog":
                        rolloverLogIds.Add(recordGuid);
                        break;
                }
            }

            // Parse composite keys for RolePermissions (e.g. "RoleId=...,PermissionId=...")
            if (table is "rolepermissions" or "rolepermission")
            {
                var parts = (item.RecordId ?? string.Empty).Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
                foreach (var part in parts)
                {
                    var seg = part.Contains('=') ? part.Split('=', 2)[1].Trim() : part.Trim();
                    if (Guid.TryParse(seg, out var gVal) && gVal != Guid.Empty)
                    {
                        if (part.Contains("Role", StringComparison.OrdinalIgnoreCase))
                            roleIds.Add(gVal);
                        else if (part.Contains("Permission", StringComparison.OrdinalIgnoreCase))
                            permissionIds.Add(gVal);
                    }
                }
            }

            // Collect IDs from property changes
            foreach (var change in item.Changes)
            {
                var prop = change.PropertyName.Trim();

                if (prop.Equals("EmployeeId", StringComparison.OrdinalIgnoreCase) ||
                    prop.EndsWith("EmployeeId", StringComparison.OrdinalIgnoreCase))
                {
                    if (Guid.TryParse(change.OldValue, out var gOld) && gOld != Guid.Empty) employeeIds.Add(gOld);
                    if (Guid.TryParse(change.NewValue, out var gNew) && gNew != Guid.Empty) employeeIds.Add(gNew);
                }
                else if (prop.Equals("DepartmentId", StringComparison.OrdinalIgnoreCase) ||
                         prop.EndsWith("DepartmentId", StringComparison.OrdinalIgnoreCase))
                {
                    if (Guid.TryParse(change.OldValue, out var gOld) && gOld != Guid.Empty) departmentIds.Add(gOld);
                    if (Guid.TryParse(change.NewValue, out var gNew) && gNew != Guid.Empty) departmentIds.Add(gNew);
                }
                else if (prop.Equals("ProfessionId", StringComparison.OrdinalIgnoreCase) ||
                         prop.EndsWith("ProfessionId", StringComparison.OrdinalIgnoreCase))
                {
                    if (Guid.TryParse(change.OldValue, out var gOld) && gOld != Guid.Empty) professionIds.Add(gOld);
                    if (Guid.TryParse(change.NewValue, out var gNew) && gNew != Guid.Empty) professionIds.Add(gNew);
                }
                else if (prop.Equals("RoleId", StringComparison.OrdinalIgnoreCase) ||
                         prop.EndsWith("RoleId", StringComparison.OrdinalIgnoreCase))
                {
                    if (Guid.TryParse(change.OldValue, out var gOld) && gOld != Guid.Empty) roleIds.Add(gOld);
                    if (Guid.TryParse(change.NewValue, out var gNew) && gNew != Guid.Empty) roleIds.Add(gNew);
                }
                else if (prop.Equals("PermissionId", StringComparison.OrdinalIgnoreCase) ||
                         prop.EndsWith("PermissionId", StringComparison.OrdinalIgnoreCase))
                {
                    if (Guid.TryParse(change.OldValue, out var gOld) && gOld != Guid.Empty) permissionIds.Add(gOld);
                    if (Guid.TryParse(change.NewValue, out var gNew) && gNew != Guid.Empty) permissionIds.Add(gNew);
                }
                else if (prop.Equals("OvertimeTypeId", StringComparison.OrdinalIgnoreCase) ||
                         prop.EndsWith("OvertimeTypeId", StringComparison.OrdinalIgnoreCase))
                {
                    if (Guid.TryParse(change.OldValue, out var gOld) && gOld != Guid.Empty) overtimeTypeIds.Add(gOld);
                    if (Guid.TryParse(change.NewValue, out var gNew) && gNew != Guid.Empty) overtimeTypeIds.Add(gNew);
                }
                else if (prop.Equals("MonthlyTimesheetId", StringComparison.OrdinalIgnoreCase) ||
                         prop.EndsWith("MonthlyTimesheetId", StringComparison.OrdinalIgnoreCase))
                {
                    if (Guid.TryParse(change.OldValue, out var gOld) && gOld != Guid.Empty) monthlyTimesheetIds.Add(gOld);
                    if (Guid.TryParse(change.NewValue, out var gNew) && gNew != Guid.Empty) monthlyTimesheetIds.Add(gNew);
                }
                else if (prop.Equals("PayrollSlipId", StringComparison.OrdinalIgnoreCase) ||
                         prop.EndsWith("PayrollSlipId", StringComparison.OrdinalIgnoreCase))
                {
                    if (Guid.TryParse(change.OldValue, out var gOld) && gOld != Guid.Empty) payrollSlipIds.Add(gOld);
                    if (Guid.TryParse(change.NewValue, out var gNew) && gNew != Guid.Empty) payrollSlipIds.Add(gNew);
                }
                else if (prop.Equals("CreatedByUserId", StringComparison.OrdinalIgnoreCase) ||
                         prop.Equals("UserId", StringComparison.OrdinalIgnoreCase))
                {
                    if (Guid.TryParse(change.OldValue, out var gOld) && gOld != Guid.Empty) userIds.Add(gOld);
                    if (Guid.TryParse(change.NewValue, out var gNew) && gNew != Guid.Empty) userIds.Add(gNew);
                }
                else if (prop.Equals("ReferenceId", StringComparison.OrdinalIgnoreCase))
                {
                    if (Guid.TryParse(change.OldValue, out var gOld) && gOld != Guid.Empty)
                    {
                        employeeIds.Add(gOld);
                        departmentIds.Add(gOld);
                    }
                    if (Guid.TryParse(change.NewValue, out var gNew) && gNew != Guid.Empty)
                    {
                        employeeIds.Add(gNew);
                        departmentIds.Add(gNew);
                    }
                }
            }
        }

        // ── 3. Batched Database Lookups (Projections with AsNoTracking) ────────

        // A. Employees
        var employeeMap = employeeIds.Count > 0
            ? await context.Employees.AsNoTracking()
                .Where(e => employeeIds.Contains(e.Id))
                .Select(e => new { e.Id, FullName = e.FirstName + " " + e.LastName, e.FirstName, e.LastName })
                .ToDictionaryAsync(e => e.Id, e => e.FullName, cancellationToken)
            : new Dictionary<Guid, string>();

        // B. Departments
        var departmentMap = departmentIds.Count > 0
            ? await context.Departments.AsNoTracking()
                .Where(d => departmentIds.Contains(d.Id))
                .Select(d => new { d.Id, d.Name })
                .ToDictionaryAsync(d => d.Id, d => d.Name, cancellationToken)
            : new Dictionary<Guid, string>();

        // C. Professions
        var professionMap = professionIds.Count > 0
            ? await context.Professions.AsNoTracking()
                .Where(p => professionIds.Contains(p.Id))
                .Select(p => new { p.Id, p.Name })
                .ToDictionaryAsync(p => p.Id, p => p.Name, cancellationToken)
            : new Dictionary<Guid, string>();

        // D. Roles
        var roleMap = roleIds.Count > 0
            ? await context.Roles.AsNoTracking()
                .Where(r => roleIds.Contains(r.Id))
                .Select(r => new { r.Id, r.Name })
                .ToDictionaryAsync(r => r.Id, r => r.Name, cancellationToken)
            : new Dictionary<Guid, string>();

        // E. Permissions
        var permissionMap = permissionIds.Count > 0
            ? await context.Permissions.AsNoTracking()
                .Where(p => permissionIds.Contains(p.Id))
                .Select(p => new { p.Id, p.Name })
                .ToDictionaryAsync(p => p.Id, p => p.Name, cancellationToken)
            : new Dictionary<Guid, string>();

        // F. OvertimeTypes
        var overtimeTypeMap = overtimeTypeIds.Count > 0
            ? await context.OvertimeTypes.AsNoTracking()
                .Where(o => overtimeTypeIds.Contains(o.Id))
                .Select(o => new { o.Id, o.Name })
                .ToDictionaryAsync(o => o.Id, o => o.Name, cancellationToken)
            : new Dictionary<Guid, string>();

        // G. Users (with Employee Name if linked)
        var userMap = userIds.Count > 0
            ? await context.Users.AsNoTracking()
                .Where(u => userIds.Contains(u.Id))
                .Select(u => new
                {
                    u.Id,
                    u.Username,
                    DisplayName = u.Employee != null ? u.Employee.FirstName + " " + u.Employee.LastName : u.Username
                })
                .ToDictionaryAsync(u => u.Id, u => u.DisplayName, cancellationToken)
            : new Dictionary<Guid, string>();

        // H. MonthlyTimesheets (projected with Employee Name, Year, Month)
        var monthlyTimesheetMap = monthlyTimesheetIds.Count > 0
            ? await context.MonthlyTimesheets.AsNoTracking()
                .Where(m => monthlyTimesheetIds.Contains(m.Id))
                .Select(m => new
                {
                    m.Id,
                    m.EmployeeId,
                    EmployeeName = m.Employee.FirstName + " " + m.Employee.LastName,
                    m.Year,
                    m.Month
                })
                .ToDictionaryAsync(m => m.Id, cancellationToken)
            : [];

        // I. TimesheetEntries (projected with MonthlyTimesheet and Employee)
        var timesheetEntryMap = timesheetEntryIds.Count > 0
            ? await context.TimesheetEntries.AsNoTracking()
                .Where(t => timesheetEntryIds.Contains(t.Id))
                .Select(t => new
                {
                    t.Id,
                    t.Date,
                    t.MonthlyTimesheetId,
                    EmployeeId = t.MonthlyTimesheet.EmployeeId,
                    EmployeeName = t.MonthlyTimesheet.Employee.FirstName + " " + t.MonthlyTimesheet.Employee.LastName,
                    t.MonthlyTimesheet.Year,
                    t.MonthlyTimesheet.Month
                })
                .ToDictionaryAsync(t => t.Id, cancellationToken)
            : [];

        // J. PayrollSlips (projected with Employee Name, Year, Month)
        var payrollSlipMap = payrollSlipIds.Count > 0
            ? await context.PayrollSlips.AsNoTracking()
                .Where(p => payrollSlipIds.Contains(p.Id))
                .Select(p => new
                {
                    p.Id,
                    p.EmployeeId,
                    EmployeeName = p.Employee.FirstName + " " + p.Employee.LastName,
                    p.Year,
                    p.Month
                })
                .ToDictionaryAsync(p => p.Id, cancellationToken)
            : [];

        // K. PayrollSlipLineItems (projected with PayrollSlip and Employee)
        var payrollSlipLineItemMap = payrollSlipLineItemIds.Count > 0
            ? await context.PayrollSlipLineItems.AsNoTracking()
                .Where(li => payrollSlipLineItemIds.Contains(li.Id))
                .Select(li => new
                {
                    li.Id,
                    li.PayrollSlipId,
                    li.ItemType,
                    EmployeeId = li.PayrollSlip.EmployeeId,
                    EmployeeName = li.PayrollSlip.Employee.FirstName + " " + li.PayrollSlip.Employee.LastName,
                    li.PayrollSlip.Year,
                    li.PayrollSlip.Month
                })
                .ToDictionaryAsync(li => li.Id, cancellationToken)
            : [];

        // L. Documents
        var documentMap = documentIds.Count > 0
            ? await context.Documents.AsNoTracking()
                .Where(d => documentIds.Contains(d.Id))
                .Select(d => new
                {
                    d.Id,
                    d.FileName,
                    d.DocumentType,
                    d.OwnerModule,
                    d.ReferenceId
                })
                .ToDictionaryAsync(d => d.Id, cancellationToken)
            : [];

        // M. YearlyRolloverLogs
        var rolloverLogMap = rolloverLogIds.Count > 0
            ? await context.YearlyRolloverLogs.AsNoTracking()
                .Where(r => rolloverLogIds.Contains(r.Id))
                .Select(r => new { r.Id, r.YearClosed })
                .ToDictionaryAsync(r => r.Id, cancellationToken)
            : [];

        // ── 4. Foreign Key (FK) Name Replacement in Changes ────────────────────
        foreach (var item in items)
        {
            var table = (item.TableName ?? string.Empty).Trim().ToLowerInvariant();
            foreach (var change in item.Changes)
            {
                var prop = change.PropertyName.Trim();

                if (prop.Equals("EmployeeId", StringComparison.OrdinalIgnoreCase) ||
                    prop.EndsWith("EmployeeId", StringComparison.OrdinalIgnoreCase))
                {
                    if (Guid.TryParse(change.OldValue, out var gOld) && employeeMap.TryGetValue(gOld, out var nameOld)) change.OldValue = nameOld;
                    if (Guid.TryParse(change.NewValue, out var gNew) && employeeMap.TryGetValue(gNew, out var nameNew)) change.NewValue = nameNew;
                }
                else if (prop.Equals("DepartmentId", StringComparison.OrdinalIgnoreCase) ||
                         prop.EndsWith("DepartmentId", StringComparison.OrdinalIgnoreCase))
                {
                    if (Guid.TryParse(change.OldValue, out var gOld) && departmentMap.TryGetValue(gOld, out var nameOld)) change.OldValue = nameOld;
                    if (Guid.TryParse(change.NewValue, out var gNew) && departmentMap.TryGetValue(gNew, out var nameNew)) change.NewValue = nameNew;
                }
                else if (prop.Equals("ProfessionId", StringComparison.OrdinalIgnoreCase) ||
                         prop.EndsWith("ProfessionId", StringComparison.OrdinalIgnoreCase))
                {
                    if (Guid.TryParse(change.OldValue, out var gOld) && professionMap.TryGetValue(gOld, out var nameOld)) change.OldValue = nameOld;
                    if (Guid.TryParse(change.NewValue, out var gNew) && professionMap.TryGetValue(gNew, out var nameNew)) change.NewValue = nameNew;
                }
                else if (prop.Equals("RoleId", StringComparison.OrdinalIgnoreCase) ||
                         prop.EndsWith("RoleId", StringComparison.OrdinalIgnoreCase))
                {
                    if (Guid.TryParse(change.OldValue, out var gOld) && roleMap.TryGetValue(gOld, out var nameOld)) change.OldValue = nameOld;
                    if (Guid.TryParse(change.NewValue, out var gNew) && roleMap.TryGetValue(gNew, out var nameNew)) change.NewValue = nameNew;
                }
                else if (prop.Equals("PermissionId", StringComparison.OrdinalIgnoreCase) ||
                         prop.EndsWith("PermissionId", StringComparison.OrdinalIgnoreCase))
                {
                    if (Guid.TryParse(change.OldValue, out var gOld) && permissionMap.TryGetValue(gOld, out var nameOld)) change.OldValue = nameOld;
                    if (Guid.TryParse(change.NewValue, out var gNew) && permissionMap.TryGetValue(gNew, out var nameNew)) change.NewValue = nameNew;
                }
                else if (prop.Equals("OvertimeTypeId", StringComparison.OrdinalIgnoreCase) ||
                         prop.EndsWith("OvertimeTypeId", StringComparison.OrdinalIgnoreCase))
                {
                    if (Guid.TryParse(change.OldValue, out var gOld) && overtimeTypeMap.TryGetValue(gOld, out var nameOld)) change.OldValue = nameOld;
                    if (Guid.TryParse(change.NewValue, out var gNew) && overtimeTypeMap.TryGetValue(gNew, out var nameNew)) change.NewValue = nameNew;
                }
                else if (prop.Equals("CreatedByUserId", StringComparison.OrdinalIgnoreCase) ||
                         prop.Equals("UserId", StringComparison.OrdinalIgnoreCase))
                {
                    if (Guid.TryParse(change.OldValue, out var gOld) && userMap.TryGetValue(gOld, out var nameOld)) change.OldValue = nameOld;
                    if (Guid.TryParse(change.NewValue, out var gNew) && userMap.TryGetValue(gNew, out var nameNew)) change.NewValue = nameNew;
                }
                else if (prop.Equals("MonthlyTimesheetId", StringComparison.OrdinalIgnoreCase) ||
                         prop.EndsWith("MonthlyTimesheetId", StringComparison.OrdinalIgnoreCase))
                {
                    if (Guid.TryParse(change.OldValue, out var gOld) && monthlyTimesheetMap.TryGetValue(gOld, out var tsOld))
                        change.OldValue = $"{tsOld.EmployeeName} ({tsOld.Month:D2}/{tsOld.Year})";
                    if (Guid.TryParse(change.NewValue, out var gNew) && monthlyTimesheetMap.TryGetValue(gNew, out var tsNew))
                        change.NewValue = $"{tsNew.EmployeeName} ({tsNew.Month:D2}/{tsNew.Year})";
                }
                else if (prop.Equals("PayrollSlipId", StringComparison.OrdinalIgnoreCase) ||
                         prop.EndsWith("PayrollSlipId", StringComparison.OrdinalIgnoreCase))
                {
                    if (Guid.TryParse(change.OldValue, out var gOld) && payrollSlipMap.TryGetValue(gOld, out var psOld))
                        change.OldValue = $"{psOld.EmployeeName} ({psOld.Month:D2}/{psOld.Year})";
                    if (Guid.TryParse(change.NewValue, out var gNew) && payrollSlipMap.TryGetValue(gNew, out var psNew))
                        change.NewValue = $"{psNew.EmployeeName} ({psNew.Month:D2}/{psNew.Year})";
                }
                else if (prop.Equals("ReferenceId", StringComparison.OrdinalIgnoreCase))
                {
                    if (Guid.TryParse(change.OldValue, out var gOld))
                    {
                        if (employeeMap.TryGetValue(gOld, out var empName)) change.OldValue = empName;
                        else if (departmentMap.TryGetValue(gOld, out var deptName)) change.OldValue = deptName;
                    }
                    if (Guid.TryParse(change.NewValue, out var gNew))
                    {
                        if (employeeMap.TryGetValue(gNew, out var empName)) change.NewValue = empName;
                        else if (departmentMap.TryGetValue(gNew, out var deptName)) change.NewValue = deptName;
                    }
                }
            }

            // Resolve composite RecordId for RolePermissions
            if (table is "rolepermissions" or "rolepermission" && !string.IsNullOrWhiteSpace(item.RecordId))
            {
                var resolved = item.RecordId;
                foreach (var (rId, rName) in roleMap)
                    resolved = resolved.Replace(rId.ToString(), rName, StringComparison.OrdinalIgnoreCase);
                foreach (var (pId, pName) in permissionMap)
                    resolved = resolved.Replace(pId.ToString(), pName, StringComparison.OrdinalIgnoreCase);
                item.RecordId = resolved;
            }
        }

        // ── 5. Generate Context-Aware EntityTitle & NavigationRoute ───────────
        foreach (var item in items)
        {
            var table = (item.TableName ?? string.Empty).Trim().ToLowerInvariant();
            var hasRecordGuid = Guid.TryParse(item.RecordId, out var recordGuid) && recordGuid != Guid.Empty;
            var cleanId = (item.RecordId ?? string.Empty).Trim();

            switch (table)
            {
                case "monthlytimesheets" or "monthlytimesheet":
                    if (hasRecordGuid && monthlyTimesheetMap.TryGetValue(recordGuid, out var tsMeta))
                    {
                        item.EntityTitle = $"{tsMeta.EmployeeName} - {tsMeta.Month:D2}/{tsMeta.Year} Timesheet";
                        item.NavigationRoute = $"/finance/timesheets/{tsMeta.EmployeeId}?year={tsMeta.Year}&month={tsMeta.Month}";
                    }
                    else
                    {
                        var empName = ExtractChangeValue(item, "EmployeeId", employeeMap) ?? "Employee";
                        var year = ExtractChangeValue(item, "Year") ?? DateTime.UtcNow.Year.ToString();
                        var month = ExtractChangeValue(item, "Month") ?? DateTime.UtcNow.Month.ToString();
                        var mNum = int.TryParse(month, out var pm) ? pm : DateTime.UtcNow.Month;
                        var yNum = int.TryParse(year, out var py) ? py : DateTime.UtcNow.Year;

                        item.EntityTitle = $"{empName} - {mNum:D2}/{yNum} Timesheet";

                        var empIdStr = ExtractRawChangeValue(item, "EmployeeId");
                        if (!string.IsNullOrEmpty(empIdStr) && Guid.TryParse(empIdStr, out var empGuid))
                            item.NavigationRoute = $"/finance/timesheets/{empGuid}?year={yNum}&month={mNum}";
                        else
                            item.NavigationRoute = "/finance/timesheets";
                    }
                    break;

                case "timesheetentries" or "timesheetentry":
                    if (hasRecordGuid && timesheetEntryMap.TryGetValue(recordGuid, out var entryMeta))
                    {
                        item.EntityTitle = $"{entryMeta.EmployeeName} - {entryMeta.Date:dd MMM yyyy} Entry";
                        item.NavigationRoute = $"/finance/timesheets/{entryMeta.EmployeeId}?year={entryMeta.Year}&month={entryMeta.Month}";
                    }
                    else
                    {
                        var dateStr = ExtractChangeValue(item, "Date");
                        var formattedDate = DateTime.TryParse(dateStr, out var dt) ? dt.ToString("dd MMM yyyy", CultureInfo.InvariantCulture) : "Daily";

                        var monthlyTsIdStr = ExtractRawChangeValue(item, "MonthlyTimesheetId");
                        if (!string.IsNullOrEmpty(monthlyTsIdStr) && Guid.TryParse(monthlyTsIdStr, out var mTsId) && monthlyTimesheetMap.TryGetValue(mTsId, out var tsParent))
                        {
                            item.EntityTitle = $"{tsParent.EmployeeName} - {formattedDate} Entry";
                            item.NavigationRoute = $"/finance/timesheets/{tsParent.EmployeeId}?year={tsParent.Year}&month={tsParent.Month}";
                        }
                        else
                        {
                            item.EntityTitle = $"{formattedDate} Timesheet Entry";
                            item.NavigationRoute = "/finance/timesheets";
                        }
                    }
                    break;

                case "payrollslips" or "payrollslip":
                    if (hasRecordGuid && payrollSlipMap.TryGetValue(recordGuid, out var psMeta))
                    {
                        item.EntityTitle = $"{psMeta.EmployeeName} - {psMeta.Month:D2}/{psMeta.Year} Payroll Slip";
                        item.NavigationRoute = $"/finance/payrolls/{psMeta.EmployeeId}";
                    }
                    else
                    {
                        var empName = ExtractChangeValue(item, "EmployeeId", employeeMap) ?? "Employee";
                        var year = ExtractChangeValue(item, "Year") ?? DateTime.UtcNow.Year.ToString();
                        var month = ExtractChangeValue(item, "Month") ?? DateTime.UtcNow.Month.ToString();
                        var mNum = int.TryParse(month, out var pm) ? pm : DateTime.UtcNow.Month;
                        var yNum = int.TryParse(year, out var py) ? py : DateTime.UtcNow.Year;

                        item.EntityTitle = $"{empName} - {mNum:D2}/{yNum} Payroll Slip";

                        var empIdStr = ExtractRawChangeValue(item, "EmployeeId");
                        if (!string.IsNullOrEmpty(empIdStr) && Guid.TryParse(empIdStr, out var empGuid))
                            item.NavigationRoute = $"/finance/payrolls/{empGuid}";
                        else
                            item.NavigationRoute = "/finance/payrolls";
                    }
                    break;

                case "payrollsliplineitems" or "payrollsliplineitem":
                    if (hasRecordGuid && payrollSlipLineItemMap.TryGetValue(recordGuid, out var liMeta))
                    {
                        item.EntityTitle = $"{liMeta.EmployeeName} - {liMeta.Month:D2}/{liMeta.Year} Deduction/Earning";
                        item.NavigationRoute = $"/finance/payrolls/{liMeta.EmployeeId}";
                    }
                    else
                    {
                        var psIdStr = ExtractRawChangeValue(item, "PayrollSlipId");
                        if (!string.IsNullOrEmpty(psIdStr) && Guid.TryParse(psIdStr, out var psId) && payrollSlipMap.TryGetValue(psId, out var psParent))
                        {
                            item.EntityTitle = $"{psParent.EmployeeName} - {psParent.Month:D2}/{psParent.Year} Deduction/Earning";
                            item.NavigationRoute = $"/finance/payrolls/{psParent.EmployeeId}";
                        }
                        else
                        {
                            item.EntityTitle = "Payroll Deduction/Earning";
                            item.NavigationRoute = "/finance/payrolls";
                        }
                    }
                    break;

                case "documents" or "document":
                    if (hasRecordGuid && documentMap.TryGetValue(recordGuid, out var docMeta))
                    {
                        item.EntityTitle = $"{docMeta.FileName} - {docMeta.DocumentType} Document";
                        item.NavigationRoute = $"/documents/{docMeta.Id}";
                    }
                    else
                    {
                        var fileName = ExtractChangeValue(item, "FileName") ?? "File";
                        var docType = ExtractChangeValue(item, "DocumentType") ?? "Document";
                        item.EntityTitle = $"{fileName} - {docType} Document";
                        item.NavigationRoute = $"/documents/{cleanId}";
                    }
                    break;

                case "users" or "user":
                    var username = hasRecordGuid && userMap.TryGetValue(recordGuid, out var uName)
                        ? uName
                        : ExtractChangeValue(item, "Username") ?? "User";
                    item.EntityTitle = $"{username} - User Account";
                    item.NavigationRoute = $"/settings/users/{cleanId}";
                    break;

                case "yearlyrolloverlogs" or "yearlyrolloverlog":
                    var yrClosed = hasRecordGuid && rolloverLogMap.TryGetValue(recordGuid, out var rollMeta)
                        ? rollMeta.YearClosed.ToString()
                        : ExtractChangeValue(item, "YearClosed") ?? DateTime.UtcNow.Year.ToString();
                    item.EntityTitle = $"Year {yrClosed} Rollover";
                    item.NavigationRoute = "/finance/timesheets";
                    break;

                case "employeeaddresses" or "employeeaddress":
                case "employeecompensations" or "employeecompensation":
                case "employeenotes" or "employeenote":
                case "employeereferences" or "employeereference":
                    var parentEmpName = ExtractChangeValue(item, "EmployeeId", employeeMap)
                        ?? (hasRecordGuid && employeeMap.TryGetValue(recordGuid, out var empN) ? empN : "Employee");
                    var sectionName = table switch
                    {
                        "employeeaddresses" or "employeeaddress" => "Employee Address",
                        "employeecompensations" or "employeecompensation" => "Employee Compensation",
                        "employeenotes" or "employeenote" => "Employee Note",
                        _ => "Employee Reference"
                    };
                    item.EntityTitle = $"{parentEmpName} - {sectionName}";

                    var parentEmpId = ExtractRawChangeValue(item, "EmployeeId");
                    if (!string.IsNullOrEmpty(parentEmpId) && Guid.TryParse(parentEmpId, out var pGuid))
                        item.NavigationRoute = $"/employees/{pGuid}";
                    else
                        item.NavigationRoute = $"/employees/{cleanId}";
                    break;

                case "employees" or "employee":
                    var empFullName = hasRecordGuid && employeeMap.TryGetValue(recordGuid, out var empNameDirect)
                        ? empNameDirect
                        : $"{ExtractChangeValue(item, "FirstName")} {ExtractChangeValue(item, "LastName")}".Trim();
                    if (string.IsNullOrWhiteSpace(empFullName)) empFullName = "Employee";
                    item.EntityTitle = $"{empFullName} - Employee";
                    item.NavigationRoute = $"/employees/{cleanId}";
                    break;

                case "departments" or "department":
                    var deptNameDirect = hasRecordGuid && departmentMap.TryGetValue(recordGuid, out var dName)
                        ? dName
                        : ExtractChangeValue(item, "Name") ?? "Department";
                    item.EntityTitle = $"{deptNameDirect} - Department";
                    item.NavigationRoute = $"/departments/{cleanId}";
                    break;

                case "professions" or "profession":
                    var profNameDirect = hasRecordGuid && professionMap.TryGetValue(recordGuid, out var prName)
                        ? prName
                        : ExtractChangeValue(item, "Name") ?? "Profession";
                    item.EntityTitle = $"{profNameDirect} - Profession";
                    item.NavigationRoute = "/departments";
                    break;

                case "roles" or "role":
                    var roleNameDirect = hasRecordGuid && roleMap.TryGetValue(recordGuid, out var rName)
                        ? rName
                        : ExtractChangeValue(item, "Name") ?? "Role";
                    item.EntityTitle = $"{roleNameDirect} - Role";
                    item.NavigationRoute = $"/settings/roles/{cleanId}";
                    break;

                case "permissions" or "permission":
                    var permNameDirect = hasRecordGuid && permissionMap.TryGetValue(recordGuid, out var pName)
                        ? pName
                        : ExtractChangeValue(item, "Name") ?? "Permission";
                    item.EntityTitle = $"{permNameDirect} - Permission";
                    item.NavigationRoute = "/settings/roles";
                    break;

                case "rolepermissions" or "rolepermission":
                    item.EntityTitle = $"{item.RecordId} - Role Permission";
                    item.NavigationRoute = "/settings/roles";
                    break;

                case "overtimetypes" or "overtimetype":
                    var otNameDirect = hasRecordGuid && overtimeTypeMap.TryGetValue(recordGuid, out var otName)
                        ? otName
                        : ExtractChangeValue(item, "Name") ?? "Overtime Type";
                    item.EntityTitle = $"{otNameDirect} - Overtime Type";
                    item.NavigationRoute = "/finance/overtime-types";
                    break;

                default:
                    // Clean fallback format for table name
                    var cleanTitle = FormatTableName(item.TableName);
                    item.EntityTitle = cleanTitle;
                    break;
            }
        }
    }

    /// <summary>
    /// Helper to extract a property value from OldValue or NewValue changes.
    /// </summary>
    private static string? ExtractChangeValue(AuditLogItemDto item, string propertyName, Dictionary<Guid, string>? lookup = null)
    {
        var change = item.Changes.FirstOrDefault(c => c.PropertyName.Equals(propertyName, StringComparison.OrdinalIgnoreCase));
        if (change == null) return null;

        var val = change.NewValue ?? change.OldValue;
        if (string.IsNullOrWhiteSpace(val)) return null;

        if (lookup != null && Guid.TryParse(val, out var g) && lookup.TryGetValue(g, out var resolvedName))
            return resolvedName;

        return val;
    }

    /// <summary>
    /// Helper to extract raw (unresolved) change value.
    /// </summary>
    private static string? ExtractRawChangeValue(AuditLogItemDto item, string propertyName)
    {
        var change = item.Changes.FirstOrDefault(c => c.PropertyName.Equals(propertyName, StringComparison.OrdinalIgnoreCase));
        return change?.NewValue ?? change?.OldValue;
    }

    /// <summary>
    /// Formats a PascalCase TableName into human-friendly spaced words (e.g. "TimesheetEntries" -> "Timesheet Entries").
    /// </summary>
    public static string FormatTableName(string? tableName)
    {
        if (string.IsNullOrWhiteSpace(tableName))
            return "System Entity";

        var name = tableName.Trim();
        var formatted = Regex.Replace(name, @"(\B[A-Z])", " $1");
        return formatted;
    }
}
