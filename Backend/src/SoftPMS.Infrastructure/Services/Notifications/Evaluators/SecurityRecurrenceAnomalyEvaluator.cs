using Microsoft.EntityFrameworkCore;
using SoftPMS.Application.Common.Interfaces;
using SoftPMS.Application.Features.Notifications.Configurations;
using SoftPMS.Application.Features.Notifications.Models;
using SoftPMS.Application.Features.Notifications.Services;

namespace SoftPMS.Infrastructure.Services.Notifications.Evaluators;

/// <summary>
/// Evaluates Security & Event Recurrence anomalies with tiered dynamic severity scaling:
/// - User account creations/deletions spike (Low >= 2, Moderate >= 4, High >= 8, Critical >= 15)
/// - Rapid permission grants/revokes volatility (Low >= 3, Moderate >= 6, High >= 12, Critical >= 25)
/// - Frequent payroll slip recalculations/modifications (Low >= 3, Moderate >= 5, High >= 8, Critical >= 15)
/// </summary>
public class SecurityRecurrenceAnomalyEvaluator : ISecurityRecurrenceAnomalyEvaluator
{
    private readonly IApplicationDbContext _context;

    public SecurityRecurrenceAnomalyEvaluator(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task EvaluateAsync(List<AuditAnomalyAlert> alerts, CancellationToken cancellationToken = default)
    {
        var windowStart = DateTime.UtcNow.AddMinutes(-AuditAnomalyRules.SecurityRecurrence.UserCrudWindowMinutes);

        // -------------------------------------------------------------
        // Rule 1: User Account Mutation Spike (Low >= 2, Mod >= 4, High >= 8, Critical >= 15 in 15 mins)
        // -------------------------------------------------------------
        var userCrudTableNames = new[] { "Users", "User" };
        var userCrudActions = new[] { "Created", "Deleted" };

        var userCrudLogs = await _context.AuditLogs
            .AsNoTracking()
            .Where(a => a.ChangedAt >= windowStart
                     && userCrudTableNames.Contains(a.TableName)
                     && userCrudActions.Contains(a.Action))
            .Select(a => new { a.RecordId, a.Action, a.ChangedByEmail })
            .ToListAsync(cancellationToken);

        var distinctUsersCount = userCrudLogs.Select(a => a.RecordId).Distinct().Count();
        if (distinctUsersCount >= AuditAnomalyRules.SecurityRecurrence.UserCrudThresholdMin)
        {
            string severity;
            if (distinctUsersCount >= 15)
                severity = "Critical";
            else if (distinctUsersCount >= 8)
                severity = "High";
            else if (distinctUsersCount >= 4)
                severity = "Moderate";
            else
                severity = "Low";

            var createdCount = userCrudLogs.Where(a => a.Action == "Created").Select(a => a.RecordId).Distinct().Count();
            var deletedCount = userCrudLogs.Where(a => a.Action == "Deleted").Select(a => a.RecordId).Distinct().Count();
            var actors = userCrudLogs.Select(a => a.ChangedByEmail).Where(e => !string.IsNullOrWhiteSpace(e)).Distinct().ToList();

            alerts.Add(new AuditAnomalyAlert
            {
                EvaluatorDomain = nameof(AuditAnomalyRules.SecurityRecurrence),
                RuleCode = AuditAnomalyRules.SecurityRecurrence.UserCrudSpikeRuleCode,
                Title = "[Audit Notice] Elevated User Account Changes",
                Message = $"User account mutation volume detected: {distinctUsersCount} distinct user accounts modified ({createdCount} created, {deletedCount} deleted) within the last 15 minutes by [{string.Join(", ", actors)}].",
                Severity = severity,
                DeduplicationKey = AuditAnomalyRules.SecurityRecurrence.UserCrudSpikeRuleCode,
                Cooldown = TimeSpan.FromHours(1),
                EntityReferenceType = "User",
                AnomalyDetails = new Dictionary<string, object?>
                {
                    ["distinctUserCount"] = distinctUsersCount,
                    ["createdCount"] = createdCount,
                    ["deletedCount"] = deletedCount,
                    ["severity"] = severity,
                    ["actors"] = actors,
                    ["windowMinutes"] = AuditAnomalyRules.SecurityRecurrence.UserCrudWindowMinutes
                }
            });
        }

        // -------------------------------------------------------------
        // Rule 2: Permission Churn & Volatility (Low >= 3, Mod >= 6, High >= 12, Critical >= 25 in 15 mins)
        // -------------------------------------------------------------
        var permTableNames = new[] { "RolePermissions", "RolePermission", "UserPermissions", "UserPermission" };
        var permActions = new[] { "Created", "Deleted", "Modified" };

        var permLogs = await _context.AuditLogs
            .AsNoTracking()
            .Where(a => a.ChangedAt >= windowStart
                     && permTableNames.Contains(a.TableName)
                     && permActions.Contains(a.Action))
            .Select(a => new { a.RecordId, a.Action, a.ChangedByEmail })
            .ToListAsync(cancellationToken);

        if (permLogs.Count >= AuditAnomalyRules.SecurityRecurrence.PermissionChangesThresholdMin)
        {
            string severity;
            if (permLogs.Count >= 25)
                severity = "Critical";
            else if (permLogs.Count >= 12)
                severity = "High";
            else if (permLogs.Count >= 6)
                severity = "Moderate";
            else
                severity = "Low";

            var grantCount = permLogs.Count(a => a.Action == "Created");
            var revokeCount = permLogs.Count(a => a.Action == "Deleted");
            var actors = permLogs.Select(a => a.ChangedByEmail).Where(e => !string.IsNullOrWhiteSpace(e)).Distinct().ToList();

            alerts.Add(new AuditAnomalyAlert
            {
                EvaluatorDomain = nameof(AuditAnomalyRules.SecurityRecurrence),
                RuleCode = AuditAnomalyRules.SecurityRecurrence.PermissionChurnRuleCode,
                Title = "[Security Notice] Rapid Permission Grants & Revocations",
                Message = $"Permission volatility detected: {permLogs.Count} permission operations ({grantCount} grants, {revokeCount} revokes) executed within the last 15 minutes by [{string.Join(", ", actors)}].",
                Severity = severity,
                DeduplicationKey = AuditAnomalyRules.SecurityRecurrence.PermissionChurnRuleCode,
                Cooldown = TimeSpan.FromHours(1),
                EntityReferenceType = "RolePermission",
                AnomalyDetails = new Dictionary<string, object?>
                {
                    ["totalPermissionOperations"] = permLogs.Count,
                    ["grants"] = grantCount,
                    ["revokes"] = revokeCount,
                    ["severity"] = severity,
                    ["actors"] = actors,
                    ["windowMinutes"] = AuditAnomalyRules.SecurityRecurrence.PermissionChangesWindowMinutes
                }
            });
        }

        // -------------------------------------------------------------
        // Rule 3: Frequent Payroll Recalculations (Low >= 3, Mod >= 5, High >= 8, Critical >= 15)
        // -------------------------------------------------------------
        var payrollTableNames = new[] { "PayrollSlips", "PayrollSlip" };

        var overcalculatedSlips = await _context.AuditLogs
            .AsNoTracking()
            .Where(a => payrollTableNames.Contains(a.TableName) && a.Action == "Modified")
            .GroupBy(a => a.RecordId)
            .Where(g => g.Count() >= AuditAnomalyRules.SecurityRecurrence.PayrollRecalculationThresholdMin)
            .Select(g => new { SlipIdStr = g.Key, ModificationCount = g.Count() })
            .ToListAsync(cancellationToken);

        foreach (var item in overcalculatedSlips)
        {
            if (Guid.TryParse(item.SlipIdStr, out var slipId))
            {
                var slip = await _context.PayrollSlips
                    .AsNoTracking()
                    .Include(p => p.Employee)
                    .FirstOrDefaultAsync(p => p.Id == slipId, cancellationToken);

                if (slip != null)
                {
                    string severity;
                    if (item.ModificationCount >= 15)
                        severity = "Critical";
                    else if (item.ModificationCount >= 8)
                        severity = "High";
                    else if (item.ModificationCount >= 5)
                        severity = "Moderate";
                    else
                        severity = "Low";

                    var employeeName = $"{slip.Employee.FirstName} {slip.Employee.LastName}".Trim();
                    var periodStr = $"{slip.Year}-{slip.Month:D2}";

                    alerts.Add(new AuditAnomalyAlert
                    {
                        EvaluatorDomain = nameof(AuditAnomalyRules.SecurityRecurrence),
                        RuleCode = AuditAnomalyRules.SecurityRecurrence.PayrollRecalculationRuleCode,
                        Title = "[Finance Notice] Frequent Payroll Recalculation",
                        Message = $"Payroll slip for {employeeName} (Period {periodStr}) has been recalculated/modified {item.ModificationCount} times.",
                        Severity = severity,
                        DeduplicationKey = $"{AuditAnomalyRules.SecurityRecurrence.PayrollRecalculationRuleCode}_{slipId}",
                        Cooldown = TimeSpan.FromHours(24),
                        EntityReferenceId = slipId,
                        EntityReferenceType = "Payroll",
                        AnomalyDetails = new Dictionary<string, object?>
                        {
                            ["payrollSlipId"] = slipId,
                            ["employeeId"] = slip.EmployeeId,
                            ["employeeName"] = employeeName,
                            ["period"] = periodStr,
                            ["modificationCount"] = item.ModificationCount,
                            ["severity"] = severity
                        }
                    });
                }
            }
        }
    }
}
