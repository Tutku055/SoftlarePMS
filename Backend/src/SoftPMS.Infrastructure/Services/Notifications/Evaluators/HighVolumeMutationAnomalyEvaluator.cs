using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using SoftPMS.Application.Common.Interfaces;
using SoftPMS.Application.Features.Notifications.Configurations;
using SoftPMS.Application.Features.Notifications.Models;
using SoftPMS.Application.Features.Notifications.Services;
using SoftPMS.Domain.Enums;

namespace SoftPMS.Infrastructure.Services.Notifications.Evaluators;

/// <summary>
/// Evaluates High-Volume Entity Mutation anomalies with dynamic multi-tier severity scaling:
/// - Employee CRUD spikes (Deletions & Updates scaling from Low to Critical)
/// - Role deletions / security strip (Moderate to Critical)
/// - Employee document mass deletion (Low to Critical)
/// - Department membership churn (Low >= 3, Moderate >= 5, High >= 10, Critical >= 20)
/// </summary>
public class HighVolumeMutationAnomalyEvaluator : IHighVolumeMutationAnomalyEvaluator
{
    private readonly IApplicationDbContext _context;

    public HighVolumeMutationAnomalyEvaluator(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task EvaluateAsync(List<AuditAnomalyAlert> alerts, CancellationToken cancellationToken = default)
    {
        var windowStart = DateTime.UtcNow.AddMinutes(-AuditAnomalyRules.HighVolumeMutation.EmployeeCrudWindowMinutes);

        // -------------------------------------------------------------
        // Rule 1: Employee CRUD (Tiered: Deletions >= 2/5/10, Updates >= 5/10/20/50 in 15 mins)
        // -------------------------------------------------------------
        var employeeTableNames = new[] { "Employees", "Employee" };

        var empLogs = await _context.AuditLogs
            .AsNoTracking()
            .Where(a => a.ChangedAt >= windowStart && employeeTableNames.Contains(a.TableName))
            .Select(a => new { a.RecordId, a.Action, a.ChangedByEmail })
            .ToListAsync(cancellationToken);

        var deletedEmpCount = empLogs.Where(a => a.Action == "Deleted").Select(a => a.RecordId).Distinct().Count();
        var updatedEmpCount = empLogs.Where(a => a.Action == "Modified").Select(a => a.RecordId).Distinct().Count();

        if (deletedEmpCount >= AuditAnomalyRules.HighVolumeMutation.EmployeeDeletionsThresholdMin || 
            updatedEmpCount >= AuditAnomalyRules.HighVolumeMutation.EmployeeUpdatesThresholdMin)
        {
            string severity;
            if (deletedEmpCount >= 10 || updatedEmpCount >= 50)
                severity = "Critical";
            else if (deletedEmpCount >= 5 || updatedEmpCount >= 20)
                severity = "High";
            else if (deletedEmpCount >= 2 || updatedEmpCount >= 10)
                severity = "Moderate";
            else
                severity = "Low";

            var actors = empLogs.Select(a => a.ChangedByEmail).Where(e => !string.IsNullOrWhiteSpace(e)).Distinct().ToList();

            alerts.Add(new AuditAnomalyAlert
            {
                EvaluatorDomain = nameof(AuditAnomalyRules.HighVolumeMutation),
                RuleCode = AuditAnomalyRules.HighVolumeMutation.EmployeeCrudSpikeRuleCode,
                Title = "[Audit Notice] Unusual Employee Record Mutation Volume",
                Message = $"Employee record mutations detected: {deletedEmpCount} deletion(s), {updatedEmpCount} update(s) within 15 minutes by [{string.Join(", ", actors)}].",
                Severity = severity,
                DeduplicationKey = AuditAnomalyRules.HighVolumeMutation.EmployeeCrudSpikeRuleCode,
                Cooldown = TimeSpan.FromHours(1),
                EntityReferenceType = "Employee",
                AnomalyDetails = new Dictionary<string, object?>
                {
                    ["distinctDeletions"] = deletedEmpCount,
                    ["distinctUpdates"] = updatedEmpCount,
                    ["severity"] = severity,
                    ["actors"] = actors,
                    ["windowMinutes"] = AuditAnomalyRules.HighVolumeMutation.EmployeeCrudWindowMinutes
                }
            });
        }

        // -------------------------------------------------------------
        // Rule 2: Role CRUD & Permission Strip (Role deleted >=1 OR bulk perms >=5)
        // -------------------------------------------------------------
        var roleTableNames = new[] { "Roles", "Role" };
        var roleLogs = await _context.AuditLogs
            .AsNoTracking()
            .Where(a => a.ChangedAt >= windowStart && roleTableNames.Contains(a.TableName) && a.Action == "Deleted")
            .Select(a => new { a.RecordId, a.ChangedByEmail })
            .ToListAsync(cancellationToken);

        var deletedRoleCount = roleLogs.Select(a => a.RecordId).Distinct().Count();

        var rolePermDeletedCount = await _context.AuditLogs
            .AsNoTracking()
            .Where(a => a.ChangedAt >= windowStart && (a.TableName == "RolePermissions" || a.TableName == "RolePermission") && a.Action == "Deleted")
            .CountAsync(cancellationToken);

        if (deletedRoleCount >= AuditAnomalyRules.HighVolumeMutation.RoleDeletionsThresholdMin || 
            rolePermDeletedCount >= AuditAnomalyRules.HighVolumeMutation.RolePermissionBulkDeletionThresholdMin)
        {
            string severity;
            if (deletedRoleCount >= 2 || rolePermDeletedCount >= 20)
                severity = "Critical";
            else if (deletedRoleCount >= 1 || rolePermDeletedCount >= 10)
                severity = "High";
            else
                severity = "Moderate";

            var actors = roleLogs.Select(a => a.ChangedByEmail).Where(e => !string.IsNullOrWhiteSpace(e)).Distinct().ToList();

            alerts.Add(new AuditAnomalyAlert
            {
                EvaluatorDomain = nameof(AuditAnomalyRules.HighVolumeMutation),
                RuleCode = AuditAnomalyRules.HighVolumeMutation.RoleCrudAnomalyRuleCode,
                Title = "[Security Notice] Role & Security Configuration Anomaly",
                Message = $"Security role / permission anomaly detected: {deletedRoleCount} role(s) deleted and {rolePermDeletedCount} role permission records removed within 15 minutes.",
                Severity = severity,
                DeduplicationKey = AuditAnomalyRules.HighVolumeMutation.RoleCrudAnomalyRuleCode,
                Cooldown = TimeSpan.FromHours(1),
                EntityReferenceType = "Role",
                AnomalyDetails = new Dictionary<string, object?>
                {
                    ["deletedRolesCount"] = deletedRoleCount,
                    ["deletedRolePermissionsCount"] = rolePermDeletedCount,
                    ["severity"] = severity,
                    ["actors"] = actors
                }
            });
        }

        // -------------------------------------------------------------
        // Rule 3: Employee Documents Bulk Deletion (Tiered: Low >= 3, Mod >= 5, High >= 10, Critical >= 20)
        // -------------------------------------------------------------
        var docTableNames = new[] { "Documents", "Document" };
        var deletedDocLogs = await _context.AuditLogs
            .AsNoTracking()
            .Where(a => a.ChangedAt >= windowStart && docTableNames.Contains(a.TableName) && a.Action == "Deleted")
            .Select(a => new { a.RecordId, a.OldValues, a.ChangedByEmail })
            .ToListAsync(cancellationToken);

        if (deletedDocLogs.Count > 0)
        {
            var activeEmployeesCount = await _context.Employees
                .CountAsync(e => !e.IsDeleted && e.EmploymentStatus == EmploymentStatus.Active, cancellationToken);
            var threshold = Math.Max(AuditAnomalyRules.HighVolumeMutation.EmployeeDocumentMinFloor, (int)Math.Ceiling(activeEmployeesCount * AuditAnomalyRules.HighVolumeMutation.EmployeeDocumentPercentThreshold));

            var employeeDocDeletions = deletedDocLogs.Count(d =>
                d.OldValues == null
                || d.OldValues.Contains("\"OwnerModule\":1")
                || d.OldValues.Contains("\"OwnerModule\":\"Employee\"")
                || !d.OldValues.Contains("\"OwnerModule\":2"));

            if (employeeDocDeletions >= AuditAnomalyRules.HighVolumeMutation.EmployeeDocumentMinFloor)
            {
                string severity;
                if (employeeDocDeletions >= 20 || employeeDocDeletions >= threshold * 2)
                    severity = "Critical";
                else if (employeeDocDeletions >= 10 || employeeDocDeletions >= threshold)
                    severity = "High";
                else if (employeeDocDeletions >= 5 || employeeDocDeletions >= Math.Max(3, threshold / 2))
                    severity = "Moderate";
                else
                    severity = "Low";

                var actors = deletedDocLogs.Select(a => a.ChangedByEmail).Where(e => !string.IsNullOrWhiteSpace(e)).Distinct().ToList();

                alerts.Add(new AuditAnomalyAlert
                {
                    EvaluatorDomain = nameof(AuditAnomalyRules.HighVolumeMutation),
                    RuleCode = AuditAnomalyRules.HighVolumeMutation.EmployeeDocumentBulkDeletionRuleCode,
                    Title = "[Audit Notice] Elevated Employee Document Deletions",
                    Message = $"Detected {employeeDocDeletions} employee document deletion(s) within the last 15 minutes.",
                    Severity = severity,
                    DeduplicationKey = AuditAnomalyRules.HighVolumeMutation.EmployeeDocumentBulkDeletionRuleCode,
                    Cooldown = TimeSpan.FromHours(1),
                    EntityReferenceType = "Document",
                    AnomalyDetails = new Dictionary<string, object?>
                    {
                        ["employeeDocDeletions"] = employeeDocDeletions,
                        ["dynamicThreshold"] = threshold,
                        ["activeEmployeesCount"] = activeEmployeesCount,
                        ["severity"] = severity,
                        ["actors"] = actors
                    }
                });
            }
        }

        // -------------------------------------------------------------
        // Rule 4: Department Membership Churn (Sweet spots: Low >=3, Moderate >=5, High >=10, Critical >=20)
        // -------------------------------------------------------------
        var empMembershipLogs = await _context.AuditLogs
            .AsNoTracking()
            .Where(a => a.ChangedAt >= windowStart && employeeTableNames.Contains(a.TableName))
            .Select(a => new { a.RecordId, a.Action, a.OldValues, a.NewValues, a.ChangedByEmail })
            .ToListAsync(cancellationToken);

        var deptAdditions = new Dictionary<Guid, int>();
        var deptRemovals = new Dictionary<Guid, int>();

        foreach (var log in empMembershipLogs)
        {
            if (log.Action == "Modified")
            {
                var oldDeptId = ExtractGuidProperty(log.OldValues, "DepartmentId");
                var newDeptId = ExtractGuidProperty(log.NewValues, "DepartmentId");

                if (oldDeptId != newDeptId)
                {
                    if (oldDeptId.HasValue)
                    {
                        deptRemovals[oldDeptId.Value] = deptRemovals.GetValueOrDefault(oldDeptId.Value) + 1;
                    }
                    if (newDeptId.HasValue)
                    {
                        deptAdditions[newDeptId.Value] = deptAdditions.GetValueOrDefault(newDeptId.Value) + 1;
                    }
                }
            }
            else if (log.Action == "Created")
            {
                var newDeptId = ExtractGuidProperty(log.NewValues, "DepartmentId");
                if (newDeptId.HasValue)
                {
                    deptAdditions[newDeptId.Value] = deptAdditions.GetValueOrDefault(newDeptId.Value) + 1;
                }
            }
            else if (log.Action == "Deleted")
            {
                var oldDeptId = ExtractGuidProperty(log.OldValues, "DepartmentId");
                if (oldDeptId.HasValue)
                {
                    deptRemovals[oldDeptId.Value] = deptRemovals.GetValueOrDefault(oldDeptId.Value) + 1;
                }
            }
        }

        var affectedDeptIds = deptAdditions.Keys.Concat(deptRemovals.Keys).Distinct().ToList();
        if (affectedDeptIds.Count > 0)
        {
            var deptNames = await _context.Departments
                .AsNoTracking()
                .Where(d => affectedDeptIds.Contains(d.Id))
                .ToDictionaryAsync(d => d.Id, d => d.Name, cancellationToken);

            foreach (var deptId in affectedDeptIds)
            {
                var additions = deptAdditions.GetValueOrDefault(deptId);
                var removals = deptRemovals.GetValueOrDefault(deptId);
                var maxCount = Math.Max(additions, removals);

                if (maxCount >= AuditAnomalyRules.HighVolumeMutation.DepartmentMembershipThresholdMin)
                {
                    string severity;
                    if (maxCount >= 20)
                        severity = "Critical";
                    else if (maxCount >= 10)
                        severity = "High";
                    else if (maxCount >= 5)
                        severity = "Moderate";
                    else
                        severity = "Low";

                    var deptName = deptNames.GetValueOrDefault(deptId, "Unknown Department");

                    alerts.Add(new AuditAnomalyAlert
                    {
                        EvaluatorDomain = nameof(AuditAnomalyRules.HighVolumeMutation),
                        RuleCode = AuditAnomalyRules.HighVolumeMutation.DepartmentMembershipChurnRuleCode,
                        Title = "[HR Notice] Department Membership Churn",
                        Message = $"Department '{deptName}' experienced membership changes within 15 minutes: {additions} addition(s), {removals} removal(s).",
                        Severity = severity,
                        DeduplicationKey = $"{AuditAnomalyRules.HighVolumeMutation.DepartmentMembershipChurnRuleCode}_{deptId}",
                        Cooldown = TimeSpan.FromHours(1),
                        EntityReferenceId = deptId,
                        EntityReferenceType = "Department",
                        AnomalyDetails = new Dictionary<string, object?>
                        {
                            ["departmentId"] = deptId,
                            ["departmentName"] = deptName,
                            ["additions"] = additions,
                            ["removals"] = removals,
                            ["severity"] = severity
                        }
                    });
                }
            }
        }
    }

    private static Guid? ExtractGuidProperty(string? json, string propertyName)
    {
        if (string.IsNullOrWhiteSpace(json))
            return null;

        try
        {
            using var doc = JsonDocument.Parse(json);
            foreach (var prop in doc.RootElement.EnumerateObject())
            {
                if (string.Equals(prop.Name, propertyName, StringComparison.OrdinalIgnoreCase))
                {
                    if (prop.Value.ValueKind == JsonValueKind.String && Guid.TryParse(prop.Value.GetString(), out var guid))
                        return guid;
                }
            }
        }
        catch
        {
            // Ignore malformed JSON
        }

        return null;
    }
}
