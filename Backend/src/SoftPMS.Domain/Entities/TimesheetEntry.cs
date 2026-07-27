using SoftPMS.Domain.Enums;

namespace SoftPMS.Domain.Entities;

public class TimesheetEntry : BaseEntity
{
    public Guid MonthlyTimesheetId { get; set; }

    public DateTime Date { get; set; }

    public TimesheetStatus Status { get; set; }

    public decimal OvertimeHours { get; set; }

    // Navigation properties
    public virtual MonthlyTimesheet MonthlyTimesheet { get; set; } = null!;
}
