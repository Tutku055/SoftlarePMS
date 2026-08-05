using SoftPMS.Domain.Entities;

namespace SoftPMS.Application.Features.Notifications.Services;

/// <summary>
/// Builds branded, responsive HTML emails on behalf of "SoftPMS" for notifications.
/// </summary>
public interface INotificationEmailTemplateBuilder
{
    /// <summary>
    /// Generates a well-designed HTML email body for a user notification.
    /// </summary>
    /// <param name="notification">The user notification entity.</param>
    /// <param name="recipientName">The recipient's display name or username.</param>
    /// <returns>Rendered HTML markup.</returns>
    string BuildNotificationEmailHtml(UserNotification notification, string recipientName);
}
