namespace SoftPMS.Application.Features.Notifications.Services;

/// <summary>
/// Scans system rules and evaluates passive notification triggers
/// (expiring documents, missing timesheets, system announcements, upcoming events).
/// </summary>
public interface IPassiveNotificationEvaluator
{
    /// <summary>
    /// Evaluates all active passive notification rules and dispatches required notifications.
    /// </summary>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>A summary dictionary of notification counts dispatched per type.</returns>
    Task<Dictionary<string, int>> EvaluateAllAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Evaluates document expiration rules and dispatches notifications for upcoming or expired documents.
    /// </summary>
    Task<int> EvaluateDocumentExpirationsAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Evaluates finance & timesheet rules and dispatches alerts for unsubmitted/missing timesheets.
    /// </summary>
    Task<int> EvaluateFinanceAlertsAsync(CancellationToken cancellationToken = default);
}
