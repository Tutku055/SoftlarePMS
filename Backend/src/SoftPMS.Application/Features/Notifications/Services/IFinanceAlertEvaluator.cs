namespace SoftPMS.Application.Features.Notifications.Services;

/// <summary>
/// Evaluator responsible for detecting missing monthly timesheets and payroll slips before period cutoffs.
/// </summary>
public interface IFinanceAlertEvaluator
{
    /// <summary>
    /// Evaluates monthly finance records and dispatches aggregated alerts for periods with missing timesheets or payrolls.
    /// </summary>
    Task<int> EvaluateFinanceAlertsAsync(CancellationToken cancellationToken = default);
}
