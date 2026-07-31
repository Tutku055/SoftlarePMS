using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SoftPMS.Application.Features.Timesheets.DTOs;
using SoftPMS.Application.Features.Timesheets.Commands.GenerateMonthlyTimesheet;
using SoftPMS.Application.Features.Timesheets.Commands.UpdateTimesheetEntry;
using SoftPMS.Application.Features.Timesheets.Commands.BulkTimesheetOperation;
using SoftPMS.Application.Features.Timesheets.Commands.ToggleTimesheetLock;
using SoftPMS.Application.Features.Timesheets.Queries.GetMonthlyTimesheet;
using SoftPMS.WebApi.Authorization;

namespace SoftPMS.WebApi.Controllers;

[Authorize]
[Route("api/employees/{employeeId}/timesheets")]
public class TimesheetsController : ApiControllerBase
{
    /// <summary>Retrieves the monthly timesheet for an employee.</summary>
    [HttpGet("{year}/{month}")]
    [HasPermission("Timesheets.Read")]
    public async Task<ActionResult<MonthlyTimesheetDto>> GetMonthlyTimesheet(Guid employeeId, int year, int month, CancellationToken ct)
    {
        var result = await Sender.Send(new GetMonthlyTimesheetQuery(employeeId, year, month), ct);
        return result != null ? Ok(result) : NotFound();
    }

    /// <summary>Generates a new monthly timesheet for an employee.</summary>
    [HttpPost]
    [HasPermission("Timesheets.Manage")]
    public async Task<ActionResult<Guid>> GenerateTimesheet(Guid employeeId, [FromBody] GenerateTimesheetRequest request, CancellationToken ct)
    {
        return Ok(await Sender.Send(new GenerateMonthlyTimesheetCommand(employeeId, request.Year, request.Month), ct));
    }

    /// <summary>Updates a single timesheet entry's status and overtime hours.</summary>
    [HttpPut("entries/{entryId}")]
    [HasPermission("Timesheets.Manage")]
    public async Task<ActionResult<bool>> UpdateTimesheetEntry(Guid employeeId, Guid entryId, [FromBody] UpdateTimesheetEntryRequest request, CancellationToken ct)
    {
        return Ok(await Sender.Send(new UpdateTimesheetEntryCommand(
            entryId, 
            request.Status, 
            request.OvertimeHours, 
            request.OvertimeTypeId,
            request.WorkedHours,
            request.PaidLeaveHours,
            request.UnpaidLeaveHours), ct));
    }

    /// <summary>Locks or unlocks a monthly timesheet.</summary>
    [HttpPut("{year}/{month}/lock")]
    [HasPermission("Timesheets.Lock")]
    public async Task<ActionResult<bool>> ToggleTimesheetLock(Guid employeeId, int year, int month, [FromBody] ToggleLockRequest request, CancellationToken ct)
    {
        return Ok(await Sender.Send(new ToggleTimesheetLockCommand(employeeId, year, month, request.Lock), ct));
    }

    /// <summary>Executes a bulk operation on timesheets across multiple employees.</summary>
    [HttpPost("/api/timesheets/bulk")]
    [HasPermission("Timesheets.Manage")]
    public async Task<ActionResult<BulkOperationResultDto>> BulkOperation([FromBody] BulkTimesheetOperationRequest request, CancellationToken ct)
    {
        return Ok(await Sender.Send(new BulkTimesheetOperationCommand(
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
            request.Status,
            request.OvertimeHours,
            request.OvertimeTypeId,
            request.PaidLeaveHours,
            request.UnpaidLeaveHours), ct));
    }
}
