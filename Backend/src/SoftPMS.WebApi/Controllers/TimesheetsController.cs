using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SoftPMS.Application.DTOs.Timesheet;
using SoftPMS.Application.Features.Timesheets.Commands.GenerateMonthlyTimesheet;
using SoftPMS.Application.Features.Timesheets.Commands.UpdateTimesheetEntry;
using SoftPMS.Application.Features.Timesheets.Queries.GetMonthlyTimesheet;
using SoftPMS.Domain.Enums;
using SoftPMS.WebApi.Authorization;

namespace SoftPMS.WebApi.Controllers;

// ── Body-only request records (route params are NOT repeated inside these) ──
// This prevents .NET 10's model binder from creating ParameterDescriptions with
// null ModelMetadata, which crashes the XML comment OpenAPI transformer.

/// <summary>Year and month to generate a monthly timesheet for.</summary>
public class GenerateTimesheetRequest
{
    /// <summary>The year.</summary>
    public int Year { get; set; }
    
    /// <summary>The month (1-12).</summary>
    public int Month { get; set; }
}

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

[Authorize]
[Route("api/employees/{employeeId}/timesheets")]
public class TimesheetsController : ApiControllerBase
{
    /// <summary>Retrieves the monthly timesheet for an employee.</summary>
    [HttpGet("{year}/{month}")]
    [HasPermission("Timesheets.Read")]
    public async Task<ActionResult<MonthlyTimesheetDto>> GetMonthlyTimesheet(Guid employeeId, int year, int month)
    {
        var result = await Sender.Send(new GetMonthlyTimesheetQuery(employeeId, year, month));
        if (result == null)
            return NotFound();
        return Ok(result);
    }

    /// <summary>Generates a new monthly timesheet for an employee.</summary>
    [HttpPost]
    [HasPermission("Timesheets.Manage")]
    public async Task<ActionResult<Guid>> GenerateTimesheet(Guid employeeId, [FromBody] GenerateTimesheetRequest request)
    {
        var result = await Sender.Send(new GenerateMonthlyTimesheetCommand(employeeId, request.Year, request.Month));
        return Ok(result);
    }

    /// <summary>Updates a single timesheet entry's status and overtime hours.</summary>
    [HttpPut("entries/{entryId}")]
    [HasPermission("Timesheets.Manage")]
    public async Task<ActionResult<bool>> UpdateTimesheetEntry(Guid employeeId, Guid entryId, [FromBody] UpdateTimesheetEntryRequest request)
    {
        var result = await Sender.Send(new UpdateTimesheetEntryCommand(
            entryId, 
            request.Status, 
            request.OvertimeHours, 
            request.OvertimeTypeId,
            request.WorkedHours,
            request.PaidLeaveHours,
            request.UnpaidLeaveHours));
        return Ok(result);
    }
}
