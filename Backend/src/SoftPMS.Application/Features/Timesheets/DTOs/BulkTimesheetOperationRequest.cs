using SoftPMS.Domain.Enums;

namespace SoftPMS.Application.Features.Timesheets.DTOs;

/// <summary>Request body for bulk timesheet operations.</summary>
public class BulkTimesheetOperationRequest
{
    public BulkTimesheetAction Action { get; set; }
    public BulkTimesheetScope Scope { get; set; }
    public BulkTimesheetPeriodType PeriodType { get; set; }
    public int Year { get; set; }
    public int Month { get; set; }
    public int? Day { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public Guid? DepartmentId { get; set; }
    public List<Guid>? EmployeeIds { get; set; }
    public TimesheetStatus? Status { get; set; }
    public decimal? OvertimeHours { get; set; }
    public Guid? OvertimeTypeId { get; set; }
    public decimal? PaidLeaveHours { get; set; }
    public decimal? UnpaidLeaveHours { get; set; }
}
