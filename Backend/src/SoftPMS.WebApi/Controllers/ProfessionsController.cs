using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SoftPMS.Application.Common.Models;
using SoftPMS.Application.Features.Professions.DTOs;
using SoftPMS.Application.Features.Professions.Commands.CreateProfession;
using SoftPMS.Application.Features.Professions.Commands.DeleteProfession;
using SoftPMS.Application.Features.Professions.Commands.UpdateProfession;
using SoftPMS.Application.Features.Professions.Queries.GetProfessionById;
using SoftPMS.Application.Features.Professions.Queries.GetProfessionsWithPagination;
using SoftPMS.Application.Features.Professions.Queries.GetProfessionsLookup;
using SoftPMS.WebApi.Authorization;

namespace SoftPMS.WebApi.Controllers;

[Authorize]
public sealed class ProfessionsController : ApiControllerBase
{
    /// <summary>Get a paginated list of professions.</summary>
    [HttpGet]
    [HasPermission("Professions.Read")]
    [ProducesResponseType(typeof(PaginatedList<ProfessionDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Get([FromQuery] GetProfessionsWithPaginationQuery query, CancellationToken ct)
    {
        return Ok(await Sender.Send(query, ct));
    }

    /// <summary>Get a lookup list of active professions.</summary>
    [HttpGet("lookup")]
    [HasPermission("Professions.Read")]
    [ProducesResponseType(typeof(List<ProfessionLookupDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetLookup(CancellationToken ct)
    {
        return Ok(await Sender.Send(new GetProfessionsLookupQuery(), ct));
    }

    /// <summary>Get a paginated, filtered list of professions.</summary>
    [HttpPost("search")]
    [HasPermission("Professions.Read")]
    [ProducesResponseType(typeof(PaginatedList<ProfessionDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Search([FromBody] GetProfessionsWithPaginationQuery query, CancellationToken ct)
    {
        return Ok(await Sender.Send(query, ct));
    }

    /// <summary>Get a single profession by id.</summary>
    [HttpGet("{id:guid}")]
    [HasPermission("Professions.Read")]
    [ProducesResponseType(typeof(ProfessionDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var result = await Sender.Send(new GetProfessionByIdQuery(id), ct);
        return Ok(result);
    }

    /// <summary>Create a new profession.</summary>
    [HttpPost]
    [HasPermission("Professions.Create")]
    [ProducesResponseType(typeof(ProfessionDto), StatusCodes.Status201Created)]
    public async Task<IActionResult> Create([FromBody] CreateProfessionCommand command, CancellationToken ct)
    {
        var result = await Sender.Send(command, ct);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    /// <summary>Update a profession.</summary>
    [HttpPut("{id:guid}")]
    [HasPermission("Professions.Update")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateProfessionCommand command, CancellationToken ct)
    {
        if (id != command.Id)
            return BadRequest(new { message = "Route id does not match command Id." });

        await Sender.Send(command, ct);
        return NoContent();
    }

    /// <summary>Delete a profession.</summary>
    [HttpDelete("{id:guid}")]
    [HasPermission("Professions.Delete")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(Guid id, [FromQuery] bool hardDelete, CancellationToken ct)
    {
        await Sender.Send(new DeleteProfessionCommand(id, hardDelete), ct);
        return NoContent();
    }
}
