using System;
using System.Collections.Generic;

namespace SoftPMS.Application.Features.SystemSettings.DTOs;

public class YearEndStatsDto
{
    public bool IsYearClosed { get; set; }
    public DateTime? ClosedAt { get; set; }
    public int TotalAffectedEmployees { get; set; }
    public int TotalMissingTimesheets { get; set; }
    public List<YearEndEmployeeStatDto> Employees { get; set; } = new();
}

public class YearEndEmployeeStatDto
{
    public Guid EmployeeId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string DepartmentName { get; set; } = string.Empty;
    public int ExpectedTimesheets { get; set; }
    public int TimesheetsCount { get; set; }
    public int MissingTimesheetsCount { get; set; }
    public bool IsLeaveEligible { get; set; }
}
