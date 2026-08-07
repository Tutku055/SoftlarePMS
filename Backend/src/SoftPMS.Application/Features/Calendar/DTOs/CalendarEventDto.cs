using SoftPMS.Domain.Enums;

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
    public VisibilityLevel VisibilityLevel { get; set; } = VisibilityLevel.Standard;
    public Guid? DepartmentId { get; set; }
    public string? DepartmentName { get; set; }
    public Guid? UserId { get; set; }
    public string? AuthorName { get; set; }
    public DateTime CreatedAt { get; set; }
}
