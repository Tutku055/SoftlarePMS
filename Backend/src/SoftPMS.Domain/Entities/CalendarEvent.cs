using SoftPMS.Domain.Enums;

namespace SoftPMS.Domain.Entities;

public class CalendarEvent : BaseEntity
{
    public string Title { get; set; } = string.Empty;

    public string? Description { get; set; }

    public DateTimeOffset StartTime { get; set; }

    public DateTimeOffset EndTime { get; set; }

    public int ReminderThresholdDays { get; set; } = 1;

    public bool SendEmailReminder { get; set; } = true;

    public VisibilityLevel VisibilityLevel { get; set; } = VisibilityLevel.Standard;

    public Guid? DepartmentId { get; set; }

    public virtual Department? Department { get; set; }

    public Guid? UserId { get; set; }

    public virtual User? User { get; set; }
}
