using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SoftPMS.Application.Common.Models;
using SoftPMS.Application.Features.Finance.DTOs;
using SoftPMS.Application.Features.Finance.Queries.GetMissingFinanceRecords;
using SoftPMS.WebApi.Authorization;

namespace SoftPMS.WebApi.Controllers;

[Authorize]
[Route("api/finance")]
public class FinanceController : ApiControllerBase
{
    /// <summary>
    /// Retrieves a paginated list of employees with missing monthly timesheets or payroll slips for a given period.
    /// </summary>
    [HttpGet("missing-records")]
    [HasPermission("Timesheets.Read", "Payrolls.Read")]
    public async Task<ActionResult<PaginatedList<MissingFinanceRecordDto>>> GetMissingRecords(
        [FromQuery] GetMissingFinanceRecordsQuery query,
        CancellationToken ct)
    {
        return Ok(await Sender.Send(query, ct));
    }
}
