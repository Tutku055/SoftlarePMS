using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SoftPMS.Application.Features.SystemSettings.Commands.CloseYearAndRolloverLeaves;
using SoftPMS.Application.Features.SystemSettings.Queries.CheckYearClosure;
using SoftPMS.Application.Features.SystemSettings.Queries.GetYearEndEmployeeStats;
using SoftPMS.Application.Features.SystemSettings.Queries.GetFilterOperators;
using SoftPMS.Application.Features.SystemSettings.Queries.GetSystemParameters;
using SoftPMS.Application.Features.SystemSettings.Commands.UpdateSystemParameters;
using SoftPMS.Application.Features.SystemSettings.Commands.UploadCompanyLogo;
using SoftPMS.Application.Features.SystemSettings.Commands.TestEmailConnection;
using SoftPMS.WebApi.Authorization;

namespace SoftPMS.WebApi.Controllers;

[Authorize]
public class SystemSettingsController : ApiControllerBase
{
    /// <summary>Close a calendar year and roll over unused leave balances for all monthly employees.</summary>
    [HttpPost("close-year/{yearToClose}")]
    [HasPermission("SystemSettings.YearEndOperations")]
    public async Task<IActionResult> CloseYearAndRolloverLeaves(int yearToClose)
    {
        await Sender.Send(new CloseYearAndRolloverLeavesCommand(yearToClose));
        return Ok(new { message = $"Year {yearToClose} closed successfully and leaves rolled over." });
    }

    /// <summary>Get year-end leave usage statistics per employee for the given year.</summary>
    [HttpGet("year-end-stats/{year}")]
    [HasPermission("SystemSettings.YearEndOperations")]
    public async Task<IActionResult> GetYearEndStats(int year)
    {
        var result = await Sender.Send(new GetYearEndEmployeeStatsQuery(year));
        return Ok(result);
    }

    /// <summary>Check whether the given year is still pending closure.</summary>
    [HttpGet("check-year-closure/{year}")]
    [HasPermission("SystemSettings.YearEndOperations")]
    public async Task<IActionResult> CheckYearClosure(int year)
    {
        var isPending = await Sender.Send(new CheckYearClosureQuery(year));
        return Ok(new { isPending });
    }

    /// <summary>Get standard datatable filter operator definitions.</summary>
    [HttpGet("filter-operators")]
    public async Task<IActionResult> GetFilterOperators()
    {
        var result = await Sender.Send(new GetFilterOperatorsQuery());
        return Ok(result);
    }

    /// <summary>Get general system parameters (General, Payroll, Email).</summary>
    [HttpGet("parameters")]
    [HasPermission("SystemSettings.Manage")]
    public async Task<IActionResult> GetSystemParameters()
    {
        var result = await Sender.Send(new GetSystemParametersQuery());
        return Ok(result);
    }

    /// <summary>Update general system parameters.</summary>
    [HttpPut("parameters")]
    [HasPermission("SystemSettings.Manage")]
    public async Task<IActionResult> UpdateSystemParameters([FromBody] UpdateSystemParametersCommand command)
    {
        var result = await Sender.Send(command);
        return Ok(result);
    }

    /// <summary>Upload company logo.</summary>
    [HttpPost("logo")]
    [HasPermission("SystemSettings.Manage")]
    public async Task<IActionResult> UploadCompanyLogo(Microsoft.AspNetCore.Http.IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest("File is required.");

        var command = new UploadCompanyLogoCommand
        {
            FileStream = file.OpenReadStream(),
            FileName = file.FileName
        };
        var result = await Sender.Send(command);
        return Ok(new { logoPath = result });
    }

    /// <summary>Test SMTP email connection by sending a real email to the current user.</summary>
    [HttpPost("test-email")]
    [HasPermission("SystemSettings.Manage")]
    public async Task<IActionResult> TestEmailConnection([FromBody] TestEmailConnectionCommand command)
    {
        var result = await Sender.Send(command);
        return Ok(result);
    }
}

