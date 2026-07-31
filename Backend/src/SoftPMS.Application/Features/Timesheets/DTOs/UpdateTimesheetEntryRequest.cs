using SoftPMS.Domain.Enums;

namespace SoftPMS.Application.Features.Timesheets.DTOs;

/// <summary>New status and overtime hours for a single timesheet entry.</summary>
public class UpdateTimesheetEntryRequest
{
    public TimesheetStatus Status { get; set; }
    public decimal OvertimeHours { get; set; }
    public Guid? OvertimeTypeId { get; set; }
    public decimal WorkedHours { get; set; }
    public decimal PaidLeaveHours { get; set; }
    public decimal UnpaidLeaveHours { get; set; }
}
