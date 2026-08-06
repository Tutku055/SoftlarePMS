namespace SoftPMS.Application.Features.Notifications.Models;

/// <summary>
/// Encapsulates the evaluation result and structured payload of an audit anomaly or milestone alert.
/// </summary>
public sealed class AuditAnomalyAlert
{
    public string EvaluatorDomain { get; set; } = string.Empty; // "SecurityRecurrence", "HighVolumeMutation", "PeriodAndCalendar"
    public string RuleCode { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string Severity { get; set; } = "Warning"; // "Info", "Warning", "Critical"
    public string DeduplicationKey { get; set; } = string.Empty;
    public TimeSpan Cooldown { get; set; } = TimeSpan.FromHours(1);
    public Dictionary<string, object?> AnomalyDetails { get; set; } = new();
    public DateTime? TargetDate { get; set; }
    public int? RemainingDays { get; set; }
    public Guid? EntityReferenceId { get; set; }
    public string? EntityReferenceType { get; set; }
}
