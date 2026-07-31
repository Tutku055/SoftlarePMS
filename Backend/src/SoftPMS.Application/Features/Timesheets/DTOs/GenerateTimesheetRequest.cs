namespace SoftPMS.Application.Features.Timesheets.DTOs;

// Route params are excluded from body records to avoid .NET 10 OpenAPI null-metadata crash.

/// <summary>Request body for monthly timesheet generation.</summary>
public class GenerateTimesheetRequest
{
    public int Year { get; set; }
    /// <summary>1–12</summary>
    public int Month { get; set; }
}
