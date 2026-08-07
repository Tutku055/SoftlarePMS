using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SoftPMS.Application.Features.AuditLogs.Queries.GetAuditLogDetailsByCorrelationId;
using SoftPMS.Application.Features.AuditLogs.Queries.GetAuditLogsWithPagination;
using SoftPMS.WebApi.Authorization;

namespace SoftPMS.WebApi.Controllers;

[Authorize]
public class AuditLogsController : ApiControllerBase
{
    /// <summary>
    /// Retrieves paginated audit logs with parsed JSON change deltas and dynamic entity status.
    /// </summary>
    [HttpGet]
    [HasPermission("AuditLogs.Read")]
    public async Task<IActionResult> GetAuditLogs(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? searchTerm = null,
        [FromQuery] string? tableName = null,
        [FromQuery] string? action = null)
    {
        var query = new GetAuditLogsWithPaginationQuery(
            pageNumber,
            pageSize,
            searchTerm,
            tableName,
            action);

        var result = await Sender.Send(query);
        return Ok(result);
    }

    /// <summary>
    /// Retrieves paginated detail items for a specific audit log correlation ID.
    /// </summary>
    [HttpGet("{correlationId:guid}/details")]
    [HasPermission("AuditLogs.Read")]
    public async Task<IActionResult> GetAuditLogDetails(
        Guid correlationId,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20)
    {
        var query = new GetAuditLogDetailsByCorrelationIdQuery(
            correlationId,
            pageNumber,
            pageSize);

        var result = await Sender.Send(query);
        return Ok(result);
    }
}

