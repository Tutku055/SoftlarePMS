using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SoftPMS.Application.Features.SystemSettings.Commands.CloseYearAndRolloverLeaves;
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
        var result = await Sender.Send(new SoftPMS.Application.Features.SystemSettings.Queries.GetYearEndEmployeeStats.GetYearEndEmployeeStatsQuery(year));
        return Ok(result);
    }

    /// <summary>Check whether the given year is still pending closure.</summary>
    [HttpGet("check-year-closure/{year}")]
    [HasPermission("SystemSettings.YearEndOperations")]
    public async Task<IActionResult> CheckYearClosure(int year)
    {
        var isPending = await Sender.Send(new SoftPMS.Application.Features.SystemSettings.Queries.CheckYearClosure.CheckYearClosureQuery(year));
        return Ok(new { isPending });
    }

    /// <summary>Get paginated system audit logs with parsed change deltas and dynamic entity status.</summary>
    [HttpGet("audit-logs")]
    [HasPermission("AuditLogs.Read")]
    public async Task<IActionResult> GetAuditLogs([FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 10, [FromQuery] string? searchTerm = null, [FromQuery] string? tableName = null, [FromQuery] string? action = null)
    {
        var query = new SoftPMS.Application.Features.SystemSettings.Queries.GetAuditLogsWithPagination.GetAuditLogsWithPaginationQuery(
            pageNumber,
            pageSize,
            searchTerm,
            tableName,
            action);

        var result = await Sender.Send(query);
        return Ok(result);
    }

    /// <summary>Get paginated detail sub-items for a specific audit log correlation ID.</summary>
    [HttpGet("audit-logs/{correlationId:guid}/details")]
    [HasPermission("AuditLogs.Read")]
    public async Task<IActionResult> GetAuditLogDetails(
        Guid correlationId,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20)
    {
        var query = new SoftPMS.Application.Features.SystemSettings.Queries.GetAuditLogDetailsByCorrelationId.GetAuditLogDetailsByCorrelationIdQuery(
            correlationId,
            pageNumber,
            pageSize);

        var result = await Sender.Send(query);
        return Ok(result);
    }
}

