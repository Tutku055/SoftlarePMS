namespace SoftPMS.Domain.Enums;

/// <summary>
/// Delivery channel switch for notifications.
/// </summary>
public enum NotificationDeliveryChannel
{
    /// <summary>In-app system notification only (saved to DB for UI display).</summary>
    System = 1,

    /// <summary>In-app notification + branded transactional HTML email on behalf of SoftPMS.</summary>
    SystemAndMail = 2
}
