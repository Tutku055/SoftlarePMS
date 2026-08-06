namespace SoftPMS.Application.Features.Notifications.Services;

/// <summary>
/// Evaluator responsible for detecting audit log anomalies, security mutations, and administrative milestones.
/// </summary>
public interface ISystemAnnouncementEvaluator
{
    /// <summary>
    /// Evaluates security mutations, high-volume entity changes, and calendar milestones,
    /// and dispatches targeted system announcements to authorized system managers.
    /// </summary>
    Task<int> EvaluateSystemAnnouncementsAsync(CancellationToken cancellationToken = default);
}
