using Microsoft.EntityFrameworkCore;
using SoftPMS.Application.Common.Interfaces;
using SoftPMS.Application.Features.Notifications.Configurations;
using SoftPMS.Application.Features.Notifications.Models;
using SoftPMS.Application.Features.Notifications.Services;
using SoftPMS.Domain.Enums;

namespace SoftPMS.Infrastructure.Services.Notifications.Evaluators;

/// <summary>
/// Evaluates Period & Business Calendar Milestones:
/// - Timesheet submission cutoff proximity (> 30% missing staff in last 3 days of month)
/// - Year-end rollover & leave carryover closure audit (1st week of January)
/// </summary>
public class PeriodAndCalendarMilestoneEvaluator : IPeriodAndCalendarMilestoneEvaluator
{
    private readonly IApplicationDbContext _context;

    public PeriodAndCalendarMilestoneEvaluator(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task EvaluateAsync(List<AuditAnomalyAlert> alerts, CancellationToken cancellationToken = default)
    {
        var calendarSettings = await _context.CalendarSettings
            .AsNoTracking()
            .FirstOrDefaultAsync(cancellationToken) ?? new Domain.Entities.CalendarSetting();

        var today = DateTime.UtcNow.AddMinutes(-calendarSettings.CompanyTimezoneOffsetMinutes).Date;
        var currentYear = today.Year;
        var currentMonth = today.Month;

        // -------------------------------------------------------------
        // Rule 1: Timesheet Cutoff Proximity Summary (Last 3 days of month & > 30% missing)
        // -------------------------------------------------------------
        var daysInMonth = DateTime.DaysInMonth(currentYear, currentMonth);
        var lastDayOfMonth = new DateTime(currentYear, currentMonth, daysInMonth);
        var daysRemaining = (int)Math.Floor((lastDayOfMonth - today).TotalDays);

        if (daysRemaining >= 0 && daysRemaining <= AuditAnomalyRules.PeriodAndCalendar.TimesheetCutoffProximityDays)
        {
            var periodStart = new DateTime(currentYear, currentMonth, 1);
            var activeEmployeesCount = await _context.Employees
                .AsNoTracking()
                .Where(e => !e.IsDeleted && e.EmploymentStatus == EmploymentStatus.Active && e.HireDate.Date <= lastDayOfMonth && (e.TerminationDate == null || e.TerminationDate.Value.Date >= periodStart))
                .CountAsync(cancellationToken);

            if (activeEmployeesCount > 0)
            {
                var enteredTimesheetCount = await _context.MonthlyTimesheets
                    .AsNoTracking()
                    .Where(t => t.Year == currentYear && t.Month == currentMonth)
                    .Select(t => t.EmployeeId)
                    .Distinct()
                    .CountAsync(cancellationToken);

                var missingCount = activeEmployeesCount - enteredTimesheetCount;
                var missingRatio = (double)missingCount / activeEmployeesCount;

                if (missingRatio > AuditAnomalyRules.PeriodAndCalendar.TimesheetMissingThresholdPercent)
                {
                    string severity;
                    if (missingRatio >= 0.70 || daysRemaining == 0)
                        severity = "Critical";
                    else if (missingRatio >= 0.50 || daysRemaining <= 1)
                        severity = "High";
                    else
                        severity = "Moderate";

                    var periodKey = $"{currentYear}-{currentMonth:D2}";
                    alerts.Add(new AuditAnomalyAlert
                    {
                        EvaluatorDomain = nameof(AuditAnomalyRules.PeriodAndCalendar),
                        RuleCode = AuditAnomalyRules.PeriodAndCalendar.TimesheetCutoffSummaryRuleCode,
                        Title = $"[Finance Milestone] Timesheet Cutoff Approaching - {periodKey}",
                        Message = $"Timesheet submission cutoff is in {daysRemaining} day(s). {missingCount} out of {activeEmployeesCount} ({missingRatio:P0}) active employees have not submitted their timesheets.",
                        Severity = severity,
                        DeduplicationKey = $"{AuditAnomalyRules.PeriodAndCalendar.TimesheetCutoffSummaryRuleCode}_{periodKey}",
                        Cooldown = TimeSpan.FromHours(24),
                        TargetDate = lastDayOfMonth,
                        RemainingDays = daysRemaining,
                        EntityReferenceType = "TimesheetSummary",
                        AnomalyDetails = new Dictionary<string, object?>
                        {
                            ["period"] = periodKey,
                            ["year"] = currentYear,
                            ["month"] = currentMonth,
                            ["totalActive"] = activeEmployeesCount,
                            ["missingCount"] = missingCount,
                            ["missingRatio"] = missingRatio,
                            ["daysRemaining"] = daysRemaining,
                            ["severity"] = severity
                        }
                    });
                }
            }
        }

        // -------------------------------------------------------------
        // Rule 2: Year-End Closure & Leave Rollover Audit (1st week of January -> Always Critical)
        // -------------------------------------------------------------
        if (currentMonth == 1 && today.Day <= AuditAnomalyRules.PeriodAndCalendar.YearEndAuditMaxDayOfJanuary)
        {
            var previousYear = currentYear - 1;
            var rolloverExists = await _context.YearlyRolloverLogs
                .AsNoTracking()
                .AnyAsync(r => r.YearClosed == previousYear, cancellationToken);

            if (!rolloverExists)
            {
                alerts.Add(new AuditAnomalyAlert
                {
                    EvaluatorDomain = nameof(AuditAnomalyRules.PeriodAndCalendar),
                    RuleCode = AuditAnomalyRules.PeriodAndCalendar.YearEndProcessPendingRuleCode,
                    Title = $"[System Milestone] Year-End Process Pending for {previousYear}",
                    Message = $"Year-end operations and leave rollover for {previousYear} have not yet been executed. Please perform year-end closure immediately.",
                    Severity = "Critical",
                    DeduplicationKey = $"{AuditAnomalyRules.PeriodAndCalendar.YearEndProcessPendingRuleCode}_{previousYear}",
                    Cooldown = TimeSpan.FromHours(24),
                    EntityReferenceType = "YearEndProcess",
                    AnomalyDetails = new Dictionary<string, object?>
                    {
                        ["pendingYear"] = previousYear,
                        ["checkedAtDay"] = today.Day,
                        ["severity"] = "Critical"
                    }
                });
            }
        }
    }
}
