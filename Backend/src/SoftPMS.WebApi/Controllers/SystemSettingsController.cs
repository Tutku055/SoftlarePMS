using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SoftPMS.Application.Features.SystemSettings.Commands.CloseYearAndRolloverLeaves;
using SoftPMS.WebApi.Authorization;

namespace SoftPMS.WebApi.Controllers;

[Authorize]
public class SystemSettingsController : ApiControllerBase
{
    [HttpPost("close-year/{yearToClose}")]
    [HasPermission("SystemSettings.YearEndOperations")]
    public async Task<IActionResult> CloseYearAndRolloverLeaves(int yearToClose)
    {
        await Sender.Send(new CloseYearAndRolloverLeavesCommand(yearToClose));
        return Ok(new { message = $"Year {yearToClose} closed successfully and leaves rolled over." });
    }

    [HttpGet("year-end-stats/{year}")]
    [HasPermission("SystemSettings.YearEndOperations")]
    public async Task<IActionResult> GetYearEndStats(int year)
    {
        var result = await Sender.Send(new SoftPMS.Application.Features.SystemSettings.Queries.GetYearEndEmployeeStats.GetYearEndEmployeeStatsQuery(year));
        return Ok(result);
    }

    [HttpGet("check-year-closure/{year}")]
    public async Task<IActionResult> CheckYearClosure(int year)
    {
        var isPending = await Sender.Send(new SoftPMS.Application.Features.SystemSettings.Queries.CheckYearClosure.CheckYearClosureQuery(year));
        return Ok(new { isPending });
    }
}
