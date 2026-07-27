using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SoftPMS.Application.DTOs.Payroll;
using SoftPMS.Application.Features.Payrolls.Commands.CalculateMonthlyPayroll;
using SoftPMS.Application.Features.Payrolls.Queries.GetEmployeePayrollSlips;
using SoftPMS.WebApi.Authorization;

namespace SoftPMS.WebApi.Controllers;

// ── Body-only request record (route param is NOT repeated inside) ──
// Prevents null ModelMetadata crash in .NET 10's XML comment OpenAPI transformer.

/// <summary>Year and month to calculate payroll for.</summary>
public class CalculatePayrollRequest
{
    /// <summary>The year.</summary>
    public int Year { get; set; }
    
    /// <summary>The month (1-12).</summary>
    public int Month { get; set; }
}

[Authorize]
[Route("api/employees/{employeeId}/payrolls")]
public class PayrollsController : ApiControllerBase
{
    /// <summary>Returns all payroll slips for an employee.</summary>
    [HttpGet]
    [HasPermission("Payrolls.Read")]
    public async Task<ActionResult<List<PayrollSlipDto>>> GetPayrollSlips(Guid employeeId)
    {
        var result = await Sender.Send(new GetEmployeePayrollSlipsQuery(employeeId));
        return Ok(result);
    }

    /// <summary>Calculates and generates a monthly payroll slip for an employee.</summary>
    [HttpPost("calculate")]
    [HasPermission("Payrolls.Manage")]
    public async Task<ActionResult<Guid>> CalculatePayroll(Guid employeeId, [FromBody] CalculatePayrollRequest request)
    {
        var result = await Sender.Send(new CalculateMonthlyPayrollCommand(employeeId, request.Year, request.Month));
        return Ok(result);
    }
}
