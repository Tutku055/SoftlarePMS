using SoftPMS.Application.Features.Notifications.Models;

namespace SoftPMS.Application.Features.Notifications.Services;

/// <summary>
/// Sub-evaluator for Period Closure & Business Calendar Milestones (Timesheet cutoff proximity, Year-end rollover audit).
/// </summary>
public interface IPeriodAndCalendarMilestoneEvaluator
{
    Task EvaluateAsync(List<AuditAnomalyAlert> alerts, CancellationToken cancellationToken = default);
}
