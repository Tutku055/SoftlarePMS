using SoftPMS.Domain.Enums;

namespace SoftPMS.Domain.Entities;

public class MonthlyTimesheet : BaseEntity
{
    public Guid EmployeeId { get; set; }

    public int Year { get; set; }

    public int Month { get; set; }

    public decimal TotalWorkedDays { get; set; }

    public decimal TotalOvertimeHours { get; set; }

    public decimal TotalAbsentDays { get; set; }

    public bool IsLocked { get; set; }

    // Navigation properties
    public virtual Employee Employee { get; set; } = null!;

    public virtual ICollection<TimesheetEntry> Entries { get; set; } = new HashSet<TimesheetEntry>();
}
