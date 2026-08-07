namespace SoftPMS.Domain.Entities;

public class CalendarEvent : BaseEntity
{
    public string Title { get; set; } = string.Empty;

    public string? Description { get; set; }

    public DateTimeOffset StartTime { get; set; }

    public DateTimeOffset EndTime { get; set; }

    public int ReminderThresholdDays { get; set; } = 1;

    public bool SendEmailReminder { get; set; } = true;
}
