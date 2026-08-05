using SoftPMS.Domain.Enums;

namespace SoftPMS.Application.Features.Notifications.Models;

/// <summary>
/// Encapsulates the payload and targeting details for dispatching a system notification.
/// </summary>
public class NotificationDispatchContext
{
    public NotificationType Type { get; set; }
    public TargetAudience Audience { get; set; } = null!;
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public DateTime? TargetDate { get; set; }
    public int? RemainingDays { get; set; }
    public Guid? EntityReferenceId { get; set; }
    public string? EntityReferenceType { get; set; }
    public string? PayloadJson { get; set; }
    public NotificationDeliveryChannel? OverrideChannel { get; set; }
}
