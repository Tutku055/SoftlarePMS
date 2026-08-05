using SoftPMS.Domain.Enums;

namespace SoftPMS.Application.Features.Notifications.DTOs;

public class AdjustNotificationThresholdDto
{
    public int ReminderDays { get; set; }
    public NotificationDeliveryChannel DeliveryChannel { get; set; }
}
