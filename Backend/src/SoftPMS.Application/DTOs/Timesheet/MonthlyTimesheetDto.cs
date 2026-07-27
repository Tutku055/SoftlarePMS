namespace SoftPMS.Application.DTOs.Timesheet;

public record MonthlyTimesheetDto(
    Guid Id,
    Guid EmployeeId,
    int Year,
    int Month,
    decimal TotalWorkedDays,
    decimal TotalOvertimeHours,
    decimal TotalAbsentDays,
    List<TimesheetEntryDto> Entries
);
