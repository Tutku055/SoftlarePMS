using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SoftPMS.Application.Features.EmployeeCompensations.Commands.UpdateEmployeeCompensation;
using SoftPMS.Domain.Enums;
using SoftPMS.WebApi.Authorization;

namespace SoftPMS.WebApi.Controllers;

/// <summary>Request body for updating an employee's compensation.</summary>
public class UpdateCompensationRequest
{
    /// <summary>The base salary amount.</summary>
    public decimal BaseSalary { get; set; }
    
    /// <summary>The type of salary (e.g., Monthly, Hourly).</summary>
    public SalaryType SalaryType { get; set; }
    
    /// <summary>The currency code.</summary>
    public Currency Currency { get; set; }
    
    /// <summary>The date this compensation becomes effective.</summary>
    public DateTime EffectiveDate { get; set; }
}

/// <summary>Request body for editing an existing compensation.</summary>
public class EditCompensationRequest
{
    public decimal BaseSalary { get; set; }
    public SalaryType SalaryType { get; set; }
    public Currency Currency { get; set; }
    public DateTime EffectiveDate { get; set; }
}

[Authorize]
[Route("api/employees/{employeeId}/compensations")]
public class EmployeeCompensationsController : ApiControllerBase
{
    /// <summary>Updates compensation details for an employee.</summary>
    [HttpPost]
    [HasPermission("Compensations.Manage")]
    public async Task<ActionResult<Guid>> UpdateCompensation(Guid employeeId, [FromBody] UpdateCompensationRequest request)
    {
        try
        {
            var command = new UpdateEmployeeCompensationCommand(
                employeeId,
                request.BaseSalary,
                request.SalaryType,
                request.Currency,
                request.EffectiveDate
            );

            var result = await Sender.Send(command);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { detail = ex.Message });
        }
    }

    /// <summary>Edits an existing compensation record.</summary>
    [HttpPut("{id}")]
    [HasPermission("Compensations.Manage")]
    public async Task<ActionResult> EditCompensation(Guid employeeId, Guid id, [FromBody] EditCompensationRequest request)
    {
        try
        {
            var command = new SoftPMS.Application.Features.EmployeeCompensations.Commands.EditEmployeeCompensation.EditEmployeeCompensationCommand(
                id,
                employeeId,
                request.BaseSalary,
                request.SalaryType,
                request.Currency,
                request.EffectiveDate
            );

            await Sender.Send(command);
            return NoContent();
        }
        catch (Exception ex)
        {
            return BadRequest(new { detail = ex.Message });
        }
    }

    /// <summary>Deletes a historical compensation record.</summary>
    [HttpDelete("{id}")]
    [HasPermission("Compensations.Manage")]
    public async Task<ActionResult> DeleteCompensation(Guid employeeId, Guid id)
    {
        await Sender.Send(new SoftPMS.Application.Features.EmployeeCompensations.Commands.DeleteEmployeeCompensation.DeleteEmployeeCompensationCommand(id));
        return NoContent();
    }
}
