namespace SoftPMS.Application.Features.Timesheets.DTOs;

public record TimesheetEntryDto(
    Guid Id,
    Guid MonthlyTimesheetId,
    DateTime Date,
    int Status,
    decimal OvertimeHours,
    Guid? OvertimeTypeId,
    int SalaryType,
    decimal WorkedHours,
    decimal PaidLeaveHours,
    decimal UnpaidLeaveHours
);
