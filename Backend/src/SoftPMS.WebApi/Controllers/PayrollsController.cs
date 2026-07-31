using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SoftPMS.Application.Features.Payrolls.DTOs;
using SoftPMS.Application.Features.Payrolls.Commands.CalculatePayroll;
using SoftPMS.Application.Features.Payrolls.Queries.GetEmployeePayrollSlips;
using SoftPMS.WebApi.Authorization;

namespace SoftPMS.WebApi.Controllers;

[Authorize]
[Route("api/employees/{employeeId}/payrolls")]
public class PayrollsController : ApiControllerBase
{
    /// <summary>Returns all payroll slips for an employee.</summary>
    [HttpGet]
    [HasPermission("Payrolls.Read")]
    public async Task<ActionResult<List<PayrollSlipDto>>> GetPayrollSlips(Guid employeeId, CancellationToken ct)
    {
        return Ok(await Sender.Send(new GetEmployeePayrollSlipsQuery(employeeId), ct));
    }

    /// <summary>Calculates and generates a monthly payroll slip for an employee.</summary>
    [HttpPost("calculate")]
    [HasPermission("Payrolls.Manage")]
    public async Task<ActionResult<Guid>> CalculatePayroll(Guid employeeId, [FromBody] CalculatePayrollRequest request, CancellationToken ct)
    {
        return Ok(await Sender.Send(new CalculatePayrollCommand(employeeId, request.Year, request.Month), ct));
    }
}
