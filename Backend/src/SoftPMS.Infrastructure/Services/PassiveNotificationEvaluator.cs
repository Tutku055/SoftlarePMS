using Microsoft.Extensions.Logging;
using SoftPMS.Application.Features.Notifications.Services;

namespace SoftPMS.Infrastructure.Services;

/// <summary>
/// High-level coordinator for all passive background notification evaluations.
/// Orchestrates specialized evaluators (DocumentExpiry, FinanceAlert, SystemAnnouncement) following Clean Architecture.
/// </summary>
public class PassiveNotificationEvaluator : IPassiveNotificationEvaluator
{
    private readonly IDocumentExpiryEvaluator _documentExpiryEvaluator;
    private readonly IFinanceAlertEvaluator _financeAlertEvaluator;
    private readonly ISystemAnnouncementEvaluator _systemAnnouncementEvaluator;
    private readonly ICalendarNotificationEvaluator _calendarNotificationEvaluator;
    private readonly ILogger<PassiveNotificationEvaluator> _logger;

    public PassiveNotificationEvaluator(
        IDocumentExpiryEvaluator documentExpiryEvaluator,
        IFinanceAlertEvaluator financeAlertEvaluator,
        ISystemAnnouncementEvaluator systemAnnouncementEvaluator,
        ICalendarNotificationEvaluator calendarNotificationEvaluator,
        ILogger<PassiveNotificationEvaluator> logger)
    {
        _documentExpiryEvaluator = documentExpiryEvaluator;
        _financeAlertEvaluator = financeAlertEvaluator;
        _systemAnnouncementEvaluator = systemAnnouncementEvaluator;
        _calendarNotificationEvaluator = calendarNotificationEvaluator;
        _logger = logger;
    }

    /// <summary>
    /// Evaluates all registered passive notification rules across all domains.
    /// </summary>
    public async Task<Dictionary<string, int>> EvaluateAllAsync(CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Starting passive notification evaluation cycle across all domains...");
        var result = new Dictionary<string, int>();

        try
        {
            var docCount = await _documentExpiryEvaluator.EvaluateDocumentExpirationsAsync(cancellationToken);
            result["DocumentExpiry"] = docCount;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred during DocumentExpiry notification evaluation.");
            result["DocumentExpiry"] = 0;
        }

        try
        {
            var finCount = await _financeAlertEvaluator.EvaluateFinanceAlertsAsync(cancellationToken);
            result["FinanceAlert"] = finCount;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred during FinanceAlert notification evaluation.");
            result["FinanceAlert"] = 0;
        }

        try
        {
            var sysCount = await _systemAnnouncementEvaluator.EvaluateSystemAnnouncementsAsync(cancellationToken);
            result["SystemAnnouncement"] = sysCount;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred during SystemAnnouncement / Anomaly notification evaluation.");
            result["SystemAnnouncement"] = 0;
        }

        try
        {
            var calCount = await _calendarNotificationEvaluator.EvaluateCalendarRemindersAsync(cancellationToken);
            result["CalendarReminders"] = calCount;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred during CalendarReminders notification evaluation.");
            result["CalendarReminders"] = 0;
        }

        var total = result.Values.Sum();
        _logger.LogInformation("Passive notification evaluation cycle finished. Total new notifications dispatched: {Total}", total);
        return result;
    }

    public Task<int> EvaluateDocumentExpirationsAsync(CancellationToken cancellationToken = default)
    {
        return _documentExpiryEvaluator.EvaluateDocumentExpirationsAsync(cancellationToken);
    }

    public Task<int> EvaluateFinanceAlertsAsync(CancellationToken cancellationToken = default)
    {
        return _financeAlertEvaluator.EvaluateFinanceAlertsAsync(cancellationToken);
    }

    public Task<int> EvaluateSystemAnnouncementsAsync(CancellationToken cancellationToken = default)
    {
        return _systemAnnouncementEvaluator.EvaluateSystemAnnouncementsAsync(cancellationToken);
    }

    public Task<int> EvaluateCalendarRemindersAsync(CancellationToken cancellationToken = default)
    {
        return _calendarNotificationEvaluator.EvaluateCalendarRemindersAsync(cancellationToken);
    }
}
