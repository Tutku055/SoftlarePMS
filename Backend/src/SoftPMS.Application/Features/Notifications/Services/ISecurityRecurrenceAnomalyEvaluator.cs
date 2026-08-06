using SoftPMS.Application.Features.Notifications.Models;

namespace SoftPMS.Application.Features.Notifications.Services;

/// <summary>
/// Sub-evaluator for Security & Event Recurrence anomalies (User spikes, Permission churn, Payroll recalculations).
/// </summary>
public interface ISecurityRecurrenceAnomalyEvaluator
{
    Task EvaluateAsync(List<AuditAnomalyAlert> alerts, CancellationToken cancellationToken = default);
}
