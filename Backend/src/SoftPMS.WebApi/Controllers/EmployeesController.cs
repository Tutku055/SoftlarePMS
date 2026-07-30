using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SoftPMS.Application.Common.Models;
using SoftPMS.Application.Features.Employees.DTOs;
using SoftPMS.Application.Features.Employees.Commands.CreateEmployee;
using SoftPMS.Application.Features.Employees.Commands.DeleteEmployee;
using SoftPMS.Application.Features.Employees.Commands.UpdateEmployee;
using SoftPMS.Application.Features.Employees.Commands.UpdateEmployeeAddress;
using SoftPMS.Application.Features.Employees.Queries.GetEmployeeById;
using SoftPMS.Application.Features.Employees.Queries.GetEmployeesWithPagination;
using SoftPMS.Domain.Enums;
using SoftPMS.WebApi.Authorization;

namespace SoftPMS.WebApi.Controllers;

[Authorize]
public sealed class EmployeesController : ApiControllerBase
{
    /// <summary>Get a paginated, filtered list of employees.</summary>
    [HttpPost("roster")]
    [HasPermission("Employees.Read")]
    [ProducesResponseType(typeof(PaginatedList<EmployeeDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Search(
        [FromBody] GetEmployeesWithPaginationQuery query,
        CancellationToken ct = default)
    {
        return Ok(await Sender.Send(query, ct));
    }

    /// <summary>Get a single employee with all related details.</summary>
    [HttpGet("{id:guid}")]
    [HasPermission("Employees.Read")]
    [ProducesResponseType(typeof(EmployeeDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var result = await Sender.Send(new GetEmployeeByIdQuery(id), ct);
        return Ok(result);
    }

    /// <summary>Create a new employee with an initial address and compensation entry.</summary>
    [HttpPost]
    [HasPermission("Employees.Create")]
    [ProducesResponseType(typeof(CreatedEmployeeDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create([FromBody] CreateEmployeeCommand command, CancellationToken ct)
    {
        var result = await Sender.Send(command, ct);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    /// <summary>Update an employee's core profile fields.</summary>
    [HttpPut("{id:guid}")]
    [HasPermission("Employees.Update")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateEmployeeCommand command, CancellationToken ct)
    {
        if (id != command.EmployeeId)
            return BadRequest(new { message = "Route id does not match command EmployeeId." });

        await Sender.Send(command, ct);
        return NoContent();
    }

    /// <summary>Soft-delete an employee.</summary>
    [HttpDelete("{id:guid}")]
    [HasPermission("Employees.Delete")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        await Sender.Send(new DeleteEmployeeCommand(id), ct);
        return NoContent();
    }

    /// <summary>Update an employee's primary address.</summary>
    [HttpPut("{id:guid}/addresses/primary")]
    [HasPermission("Employees.Update")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateAddress(Guid id, [FromBody] UpdateEmployeeAddressCommand command, CancellationToken ct)
    {
        if (id != command.EmployeeId)
            return BadRequest(new { message = "Route id does not match command EmployeeId." });

        await Sender.Send(command, ct);
        return NoContent();
    }
}
