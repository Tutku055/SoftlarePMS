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

[Authorize]
[Route("api/employees/{employeeId}/compensations")]
public class EmployeeCompensationsController : ApiControllerBase
{
    /// <summary>Updates compensation details for an employee.</summary>
    [HttpPost]
    [HasPermission("Compensations.Manage")]
    public async Task<ActionResult<Guid>> UpdateCompensation(Guid employeeId, [FromBody] UpdateCompensationRequest request)
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
}
