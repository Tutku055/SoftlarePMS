namespace SoftPMS.Application.DTOs.Timesheet;

public record TimesheetEntryDto(
    Guid Id,
    Guid MonthlyTimesheetId,
    DateTime Date,
    int Status,
    decimal OvertimeHours,
    Guid? OvertimeTypeId
);
