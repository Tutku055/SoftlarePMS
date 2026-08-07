namespace SoftPMS.Domain.Entities;

public class EventReminderTracker : BaseEntity
{
    public string ReferenceKey { get; set; } = string.Empty;

    public DateTime SentAt { get; set; } = DateTime.UtcNow;
}
