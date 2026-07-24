using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SoftPMS.Application.DTOs.EmployeeNote;
using SoftPMS.Application.Features.EmployeeNotes.Commands.CreateEmployeeNote;
using SoftPMS.Application.Features.EmployeeNotes.Commands.DeleteEmployeeNote;
using SoftPMS.Application.Features.EmployeeNotes.Commands.UpdateEmployeeNote;
using SoftPMS.Application.Features.EmployeeNotes.Queries.GetEmployeeNotes;
using SoftPMS.Domain.Enums;
using SoftPMS.WebApi.Authorization;

namespace SoftPMS.WebApi.Controllers;

[Authorize]
[Route("api/employees/{employeeId:guid}/notes")]
public sealed class EmployeeNotesController : ApiControllerBase
{
    [HttpGet]
    [HasPermission("EmployeeNotes.Read")]
    public async Task<IActionResult> Get(Guid employeeId, [FromQuery] NoteCategory? category, [FromQuery] bool? isConfidential, CancellationToken ct)
    {
        var result = await Sender.Send(new GetEmployeeNotesQuery(employeeId, category, isConfidential), ct);
        return Ok(result);
    }

    [HttpPost]
    [HasPermission("EmployeeNotes.Create")]
    public async Task<IActionResult> Create(Guid employeeId, [FromBody] CreateEmployeeNoteDto dto, CancellationToken ct)
    {
        var command = new CreateEmployeeNoteCommand(employeeId, dto);
        var result = await Sender.Send(command, ct);
        return Ok(result);
    }

    [HttpPut("{id:guid}")]
    [HasPermission("EmployeeNotes.Update")]
    public async Task<IActionResult> Update(Guid employeeId, Guid id, [FromBody] UpdateEmployeeNoteDto dto, CancellationToken ct)
    {
        await Sender.Send(new UpdateEmployeeNoteCommand(id, dto), ct);
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    [HasPermission("EmployeeNotes.Delete")]
    public async Task<IActionResult> Delete(Guid employeeId, Guid id, CancellationToken ct)
    {
        await Sender.Send(new DeleteEmployeeNoteCommand(id), ct);
        return NoContent();
    }
}
