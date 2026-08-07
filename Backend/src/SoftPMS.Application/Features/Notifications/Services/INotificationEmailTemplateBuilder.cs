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

    /// <summary>
    /// Generates a festive, warm celebratory birthday card email addressed directly to the birthday celebrant.
    /// </summary>
    /// <param name="celebrantFirstName">The birthday celebrant's first name.</param>
    /// <returns>Rendered HTML markup.</returns>
    string BuildBirthdayCelebrantEmailHtml(string celebrantFirstName);

    /// <summary>
    /// Generates a cheerful announcement email to all colleagues informing them of an employee's birthday today.
    /// </summary>
    /// <param name="celebrantFullName">The full name of the employee having a birthday.</param>
    /// <param name="recipientName">The colleague recipient's name.</param>
    /// <returns>Rendered HTML markup.</returns>
    string BuildBirthdayColleagueAnnouncementEmailHtml(string celebrantFullName, string recipientName);
}
