using SoftPMS.Domain.Enums;

namespace SoftPMS.Application.Features.Notifications.DTOs;

public class UserNotificationDto
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public NotificationType Type { get; set; }
    public string TypeName { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public NotificationDeliveryChannel DeliveryChannel { get; set; }
    public bool IsRead { get; set; }
    public DateTime? ReadAt { get; set; }

    /// <summary>Raw target date provided for frontend dynamic urgency calculations.</summary>
    public DateTime? TargetDate { get; set; }

    /// <summary>Raw remaining days until target date or overdue days.</summary>
    public int? RemainingDays { get; set; }

    public Guid? EntityReferenceId { get; set; }
    public string? EntityReferenceType { get; set; }
    public string? PayloadJson { get; set; }
    public DateTime CreatedAt { get; set; }
}
