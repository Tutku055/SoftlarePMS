using MediatR;
using SoftPMS.Application.Features.EmployeeNotes.DTOs;

namespace SoftPMS.Application.Features.EmployeeNotes.Commands.UpdateEmployeeNote;

/// <summary>
/// Represents the Command to update employee note.
/// </summary>
public record UpdateEmployeeNoteCommand(
    Guid NoteId,
    UpdateEmployeeNoteDto Dto
) : IRequest;


