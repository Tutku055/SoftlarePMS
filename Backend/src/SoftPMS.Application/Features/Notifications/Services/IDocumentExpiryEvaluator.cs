namespace SoftPMS.Application.Features.Notifications.Services;

/// <summary>
/// Evaluator responsible for detecting expiring employee and department documents within configured reminder thresholds.
/// </summary>
public interface IDocumentExpiryEvaluator
{
    /// <summary>
    /// Scans documents and dispatches passive notifications for documents approaching expiration.
    /// </summary>
    Task<int> EvaluateDocumentExpirationsAsync(CancellationToken cancellationToken = default);
}
