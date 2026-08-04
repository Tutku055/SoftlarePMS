using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SoftPMS.Application.Common.Models;
using SoftPMS.Application.Features.EmployeeAddresses.Commands.CreateEmployeeAddress;
using SoftPMS.Application.Features.EmployeeAddresses.Commands.DeleteEmployeeAddress;
using SoftPMS.Application.Features.EmployeeAddresses.Commands.UpdateEmployeeAddress;
using SoftPMS.Application.Features.EmployeeAddresses.DTOs;
using SoftPMS.Application.Features.EmployeeAddresses.Queries.GetEmployeeAddressById;
using SoftPMS.Application.Features.EmployeeAddresses.Queries.GetEmployeeAddresses;
using SoftPMS.Application.Features.EmployeeAddresses.Queries.GetEmployeeAddressesWithPagination;
using SoftPMS.WebApi.Authorization;

namespace SoftPMS.WebApi.Controllers;

[Authorize]
public sealed class EmployeeAddressesController : ApiControllerBase
{
    /// <summary>Get all historical addresses for an employee.</summary>
    [HttpGet("/api/employees/{employeeId:guid}/addresses")]
    [HasPermission("EmployeeAddresses.Read")]
    [ProducesResponseType(typeof(List<EmployeeAddressDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetByEmployeeId(
        Guid employeeId, 
        [FromQuery] bool? onlyActive, 
        CancellationToken ct)
    {
        var result = await Sender.Send(new GetEmployeeAddressesQuery(employeeId, onlyActive), ct);
        return Ok(result);
    }

    /// <summary>Get a single employee address by ID.</summary>
    [HttpGet("/api/employees/{employeeId:guid}/addresses/{id:guid}")]
    [HasPermission("EmployeeAddresses.Read")]
    [ProducesResponseType(typeof(EmployeeAddressDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(
        Guid employeeId, 
        Guid id, 
        CancellationToken ct)
    {
        var result = await Sender.Send(new GetEmployeeAddressByIdQuery(id, employeeId), ct);
        return Ok(result);
    }

    /// <summary>Create a new historical address for an employee.</summary>
    [HttpPost("/api/employees/{employeeId:guid}/addresses")]
    [HasPermission("EmployeeAddresses.Create")]
    [ProducesResponseType(typeof(EmployeeAddressDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create(
        Guid employeeId, 
        [FromBody] CreateEmployeeAddressDto dto, 
        CancellationToken ct)
    {
        var result = await Sender.Send(new CreateEmployeeAddressCommand(employeeId, dto), ct);
        return Created($"/api/employees/{employeeId}/addresses/{result.Id}", result);
    }

    /// <summary>Update an existing historical employee address.</summary>
    [HttpPut("/api/employees/{employeeId:guid}/addresses/{id:guid}")]
    [HasPermission("EmployeeAddresses.Update")]
    [ProducesResponseType(typeof(EmployeeAddressDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(
        Guid employeeId, 
        Guid id, 
        [FromBody] UpdateEmployeeAddressDto dto, 
        CancellationToken ct)
    {
        var result = await Sender.Send(new UpdateEmployeeAddressCommand(id, employeeId, dto), ct);
        return Ok(result);
    }

    /// <summary>Delete an employee address record.</summary>
    [HttpDelete("/api/employees/{employeeId:guid}/addresses/{id:guid}")]
    [HasPermission("EmployeeAddresses.Delete")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(
        Guid employeeId, 
        Guid id, 
        CancellationToken ct)
    {
        await Sender.Send(new DeleteEmployeeAddressCommand(id, employeeId), ct);
        return NoContent();
    }

    /// <summary>Get a paginated, filtered list of addresses for a specific employee (DataTable support).</summary>
    [HttpPost("/api/employees/{employeeId:guid}/addresses/search")]
    [HasPermission("EmployeeAddresses.Read")]
    [ProducesResponseType(typeof(PaginatedList<EmployeeAddressDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> SearchByEmployee(
        Guid employeeId,
        [FromBody] GetEmployeeAddressesWithPaginationQuery query,
        CancellationToken ct = default)
    {
        var request = query with { EmployeeId = employeeId };
        var result = await Sender.Send(request, ct);
        return Ok(result);
    }

    /// <summary>Get a paginated, filtered list of all employee addresses (Global DataTable support).</summary>
    [HttpPost("/api/employee-addresses/search")]
    [HasPermission("EmployeeAddresses.Read")]
    [ProducesResponseType(typeof(PaginatedList<EmployeeAddressDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> SearchAll(
        [FromBody] GetEmployeeAddressesWithPaginationQuery query,
        CancellationToken ct = default)
    {
        var result = await Sender.Send(query, ct);
        return Ok(result);
    }
}
