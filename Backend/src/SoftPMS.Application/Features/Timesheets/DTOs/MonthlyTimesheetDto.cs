namespace SoftPMS.Application.Features.Timesheets.DTOs;

public record MonthlyTimesheetDto(
    Guid Id,
    Guid EmployeeId,
    int Year,
    int Month,
    decimal TotalWorkedDays,
    decimal TotalOvertimeHours,
    decimal TotalAbsentDays,
    List<TimesheetEntryDto> Entries,
    bool IsLocked = false,
    bool IsPreviousYearPendingClosure = false
);
