using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SoftPMS.Application.Features.EmployeeReferences.DTOs;
using SoftPMS.Application.Features.EmployeeReferences.Commands.CreateEmployeeReference;
using SoftPMS.Application.Features.EmployeeReferences.Commands.DeleteEmployeeReference;
using SoftPMS.Application.Features.EmployeeReferences.Commands.UpdateEmployeeReference;
using SoftPMS.Application.Features.EmployeeReferences.Queries.GetEmployeeReferences;
using SoftPMS.WebApi.Authorization;

namespace SoftPMS.WebApi.Controllers;

[Authorize]
[Route("api/employees/{employeeId:guid}/references")]
public sealed class EmployeeReferencesController : ApiControllerBase
{
    [HttpGet]
    [HasPermission("EmployeeReferences.Read")]
    public async Task<IActionResult> Get(Guid employeeId, CancellationToken ct)
    {
        var result = await Sender.Send(new GetEmployeeReferencesQuery(employeeId), ct);
        return Ok(result);
    }

    [HttpPost]
    [HasPermission("EmployeeReferences.Create")]
    [ProducesResponseType(typeof(EmployeeReferenceDto), StatusCodes.Status201Created)]
    public async Task<IActionResult> Create(Guid employeeId, [FromBody] CreateEmployeeReferenceDto dto, CancellationToken ct)
    {
        var command = new CreateEmployeeReferenceCommand(employeeId, dto);
        var result = await Sender.Send(command, ct);
        return Created($"/api/employees/{employeeId}/references", result);
    }

    [HttpPut("{id:guid}")]
    [HasPermission("EmployeeReferences.Update")]
    public async Task<IActionResult> Update(Guid employeeId, Guid id, [FromBody] UpdateEmployeeReferenceDto dto, CancellationToken ct)
    {
        await Sender.Send(new UpdateEmployeeReferenceCommand(id, dto), ct);
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    [HasPermission("EmployeeReferences.Delete")]
    public async Task<IActionResult> Delete(Guid employeeId, Guid id, CancellationToken ct)
    {
        await Sender.Send(new DeleteEmployeeReferenceCommand(id), ct);
        return NoContent();
    }
}
