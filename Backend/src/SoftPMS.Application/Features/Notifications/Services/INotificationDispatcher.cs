using SoftPMS.Application.Features.Notifications.Models;

namespace SoftPMS.Application.Features.Notifications.Services;

/// <summary>
/// Contract for dispatching notifications using Fan-Out on Write.
/// Ensures strict per-user database isolation and optional transactional email delivery.
/// </summary>
public interface INotificationDispatcher
{
    /// <summary>
    /// Dispatches a notification to the specified audience.
    /// Evaluates active/muted settings and delivery channels.
    /// </summary>
    /// <param name="context">The notification payload and target audience.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>The number of individual user notifications generated and persisted.</returns>
    Task<int> DispatchAsync(NotificationDispatchContext context, CancellationToken cancellationToken = default);
}
