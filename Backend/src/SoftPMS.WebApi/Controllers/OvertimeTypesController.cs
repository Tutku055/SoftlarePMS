using MediatR;
using Microsoft.AspNetCore.Mvc;
using SoftPMS.Application.Features.OvertimeTypes.DTOs;
using SoftPMS.Application.Features.OvertimeTypes.Commands.CreateOvertimeType;
using SoftPMS.Application.Features.OvertimeTypes.Commands.DeleteOvertimeType;
using SoftPMS.Application.Features.OvertimeTypes.Commands.UpdateOvertimeType;
using SoftPMS.Application.Features.OvertimeTypes.Queries.GetOvertimeTypes;
using SoftPMS.Application.Features.OvertimeTypes.Queries.GetOvertimeTypesWithPagination;
using SoftPMS.WebApi.Authorization;
using Microsoft.AspNetCore.Authorization;

namespace SoftPMS.WebApi.Controllers;

[Authorize]
public class OvertimeTypesController : ApiControllerBase
{

    [HttpGet]
    [HasPermission("OvertimeTypes.Read")]
    public async Task<ActionResult<List<OvertimeTypeDto>>> Get([FromQuery] bool includeDeleted = false)
    {
        var result = await Sender.Send(new GetOvertimeTypesQuery(includeDeleted));
        return Ok(result);
    }

    [HttpPost("paged")]
    [HasPermission("OvertimeTypes.Read")]
    public async Task<ActionResult<SoftPMS.Application.Common.Models.PaginatedList<OvertimeTypeDto>>> GetPaged([FromBody] GetOvertimeTypesWithPaginationQuery query)
    {
        var result = await Sender.Send(query);
        return Ok(result);
    }

    [HttpPost]
    [HasPermission("OvertimeTypes.Create")]
    public async Task<ActionResult<Guid>> Create([FromBody] CreateOvertimeTypeCommand command)
    {
        var id = await Sender.Send(command);
        return Ok(id);
    }

    [HttpPut("{id}")]
    [HasPermission("OvertimeTypes.Update")]
    public async Task<ActionResult> Update(Guid id, [FromBody] UpdateOvertimeTypeCommand command)
    {
        if (id != command.Id)
            return BadRequest(new { message = "Id mismatch" });

        await Sender.Send(command);
        return NoContent();
    }

    [HttpDelete("{id}")]
    [HasPermission("OvertimeTypes.Delete")]
    public async Task<ActionResult> Delete(Guid id)
    {
        await Sender.Send(new DeleteOvertimeTypeCommand(id));
        return NoContent();
    }

    [HttpPatch("{id}/restore")]
    [HasPermission("OvertimeTypes.Update")]
    public async Task<ActionResult> Restore(Guid id)
    {
        await Sender.Send(new SoftPMS.Application.Features.OvertimeTypes.Commands.RestoreOvertimeType.RestoreOvertimeTypeCommand(id));
        return NoContent();
    }
}
