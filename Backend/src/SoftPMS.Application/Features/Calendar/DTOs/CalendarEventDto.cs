namespace SoftPMS.Application.Features.Calendar.DTOs;

public class CalendarEventDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTimeOffset StartTime { get; set; }
    public DateTimeOffset EndTime { get; set; }
    public int ReminderThresholdDays { get; set; }
    public bool SendEmailReminder { get; set; }
    public DateTime CreatedAt { get; set; }
}
