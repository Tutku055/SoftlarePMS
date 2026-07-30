using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SoftPMS.Application.Features.EmployeeCompensations.Commands.UpdateEmployeeCompensation;
using SoftPMS.Domain.Enums;
using SoftPMS.WebApi.Authorization;

namespace SoftPMS.WebApi.Controllers;

[Authorize]
public class EmployeeCompensationsController : ApiControllerBase
{
    /// <summary>Updates compensation details for an employee.</summary>
    [HttpPost("{employeeId:guid}")]
    [HasPermission("Compensations.Manage")]
    public async Task<ActionResult<Guid>> UpdateCompensation(Guid employeeId, [FromBody] UpdateEmployeeCompensationCommand command)
    {
        if (employeeId != command.EmployeeId)
        {
            command.EmployeeId = employeeId;
        }

        var result = await Sender.Send(command);
        return Ok(result);
    }

    /// <summary>Edits an existing compensation record.</summary>
    [HttpPut("{employeeId:guid}/{id:guid}")]
    [HasPermission("Compensations.Manage")]
    public async Task<ActionResult> EditCompensation(Guid employeeId, Guid id, [FromBody] SoftPMS.Application.Features.EmployeeCompensations.Commands.EditEmployeeCompensation.EditEmployeeCompensationCommand command)
    {
        if (id != command.Id || employeeId != command.EmployeeId)
        {
            command.Id = id;
            command.EmployeeId = employeeId;
        }

        await Sender.Send(command);
        return NoContent();
    }

    /// <summary>Deletes a historical compensation record.</summary>
    [HttpDelete("{employeeId:guid}/{id:guid}")]
    [HasPermission("Compensations.Manage")]
    public async Task<ActionResult> DeleteCompensation(Guid employeeId, Guid id)
    {
        await Sender.Send(new SoftPMS.Application.Features.EmployeeCompensations.Commands.DeleteEmployeeCompensation.DeleteEmployeeCompensationCommand(id));
        return NoContent();
    }
}
