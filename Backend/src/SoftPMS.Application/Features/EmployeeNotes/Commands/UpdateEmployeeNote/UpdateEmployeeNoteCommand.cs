using MediatR;
using SoftPMS.Application.Features.EmployeeNotes.DTOs;

namespace SoftPMS.Application.Features.EmployeeNotes.Commands.UpdateEmployeeNote;

public record UpdateEmployeeNoteCommand(
    Guid NoteId,
    UpdateEmployeeNoteDto Dto
) : IRequest;
