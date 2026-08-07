namespace SoftPMS.Application.Features.Notifications.Services;

/// <summary>
/// Evaluates physical events, public holidays, and employee birthdays for upcoming notification reminders.
/// Dispatches in-app notifications and email outbox records with strict idempotency via EventReminderTracker.
/// </summary>
public interface ICalendarNotificationEvaluator
{
    Task<int> EvaluateCalendarRemindersAsync(CancellationToken cancellationToken = default);
}
