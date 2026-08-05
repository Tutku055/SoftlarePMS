using SoftPMS.Domain.Enums;

namespace SoftPMS.Application.Features.Notifications.DTOs;

public class NotificationTypeSettingDto
{
    public Guid Id { get; set; }
    public NotificationType Type { get; set; }
    public string TypeName { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public bool IsMuted { get; set; }
    public int ReminderDays { get; set; }
    public NotificationDeliveryChannel DeliveryChannel { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public IReadOnlyCollection<string> SupportedPlaceholders { get; set; } = Array.Empty<string>();
    public IReadOnlyCollection<string> RequiredPermissions { get; set; } = Array.Empty<string>();
}

