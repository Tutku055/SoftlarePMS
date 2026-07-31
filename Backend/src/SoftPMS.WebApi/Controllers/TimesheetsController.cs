using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SoftPMS.Application.Features.Timesheets.DTOs;
using SoftPMS.Application.Features.Timesheets.Commands.GenerateMonthlyTimesheet;
using SoftPMS.Application.Features.Timesheets.Commands.UpdateTimesheetEntry;
using SoftPMS.Application.Features.Timesheets.Commands.BulkTimesheetOperation;
using SoftPMS.Application.Features.Timesheets.Queries.GetMonthlyTimesheet;
using SoftPMS.Domain.Enums;
using SoftPMS.WebApi.Authorization;

namespace SoftPMS.WebApi.Controllers;

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
}

// Route params are excluded from body records to avoid .NET 10 OpenAPI null-metadata crash.

/// <summary>Request body for monthly timesheet generation.</summary>
public class GenerateTimesheetRequest
{
    public int Year { get; set; }
    /// <summary>1–12</summary>
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

    /// <summary>Locks or unlocks a monthly timesheet.</summary>
    [HttpPut("{year}/{month}/lock")]
    [HasPermission("Timesheets.Lock")]
    public async Task<ActionResult<bool>> ToggleTimesheetLock(Guid employeeId, int year, int month, [FromBody] ToggleLockRequest request)
    {
        var result = await Sender.Send(new SoftPMS.Application.Features.Timesheets.Commands.ToggleTimesheetLock.ToggleTimesheetLockCommand(employeeId, year, month, request.Lock));
        return Ok(result);
    }

    /// <summary>Executes a bulk operation on timesheets across multiple employees.</summary>
    [HttpPost("/api/timesheets/bulk")]
    [HasPermission("Timesheets.Manage")]
    public async Task<ActionResult<BulkOperationResultDto>> BulkOperation([FromBody] BulkTimesheetOperationRequest request)
    {
        var result = await Sender.Send(new BulkTimesheetOperationCommand(
            request.Action,
            request.Scope,
            request.PeriodType,
            request.Year,
            request.Month,
            request.Day,
            request.StartDate,
            request.EndDate,
            request.DepartmentId,
            request.EmployeeIds,
            request.Status));
        return Ok(result);
    }
}

public class ToggleLockRequest
{
    public bool Lock { get; set; }
}
