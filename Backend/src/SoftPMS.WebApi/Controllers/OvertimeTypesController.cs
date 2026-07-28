using MediatR;
using Microsoft.AspNetCore.Mvc;
using SoftPMS.Application.DTOs.OvertimeType;
using SoftPMS.Application.Features.OvertimeTypes.Commands.CreateOvertimeType;
using SoftPMS.Application.Features.OvertimeTypes.Commands.DeleteOvertimeType;
using SoftPMS.Application.Features.OvertimeTypes.Commands.UpdateOvertimeType;
using SoftPMS.Application.Features.OvertimeTypes.Queries.GetOvertimeTypes;
using SoftPMS.Application.Features.OvertimeTypes.Queries.GetOvertimeTypesWithPagination;
using SoftPMS.WebApi.Authorization;

namespace SoftPMS.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class OvertimeTypesController : ControllerBase
{
    private readonly IMediator _mediator;

    public OvertimeTypesController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    public async Task<ActionResult<List<OvertimeTypeDto>>> Get([FromQuery] bool includeDeleted = false)
    {
        var result = await _mediator.Send(new GetOvertimeTypesQuery(includeDeleted));
        return Ok(result);
    }

    [HttpPost("paged")]
    public async Task<ActionResult<SoftPMS.Application.Common.Models.PaginatedList<OvertimeTypeDto>>> GetPaged([FromBody] GetOvertimeTypesWithPaginationQuery query)
    {
        var result = await _mediator.Send(query);
        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<Guid>> Create([FromBody] CreateOvertimeTypeCommand command)
    {
        var id = await _mediator.Send(command);
        return Ok(id);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult> Update(Guid id, [FromBody] UpdateOvertimeTypeCommand command)
    {
        if (id != command.Id)
            return BadRequest("Id mismatch");

        await _mediator.Send(command);
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(Guid id)
    {
        await _mediator.Send(new DeleteOvertimeTypeCommand(id));
        return NoContent();
    }

    [HttpPatch("{id}/restore")]
    public async Task<ActionResult> Restore(Guid id)
    {
        await _mediator.Send(new SoftPMS.Application.Features.OvertimeTypes.Commands.RestoreOvertimeType.RestoreOvertimeTypeCommand(id));
        return NoContent();
    }
}
