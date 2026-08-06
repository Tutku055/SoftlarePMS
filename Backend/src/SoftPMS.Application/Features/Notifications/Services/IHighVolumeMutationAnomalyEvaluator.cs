using SoftPMS.Application.Features.Notifications.Models;

namespace SoftPMS.Application.Features.Notifications.Services;

/// <summary>
/// Sub-evaluator for High-Volume Entity Mutation anomalies (Employee CRUD spikes, Role deletions, Document mass deletions, Department churn).
/// </summary>
public interface IHighVolumeMutationAnomalyEvaluator
{
    Task EvaluateAsync(List<AuditAnomalyAlert> alerts, CancellationToken cancellationToken = default);
}
