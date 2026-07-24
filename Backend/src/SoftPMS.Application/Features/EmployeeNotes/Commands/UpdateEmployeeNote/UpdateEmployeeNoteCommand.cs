using MediatR;
using SoftPMS.Application.DTOs.EmployeeNote;

namespace SoftPMS.Application.Features.EmployeeNotes.Commands.UpdateEmployeeNote;

public record UpdateEmployeeNoteCommand(
    Guid NoteId,
    UpdateEmployeeNoteDto Dto
) : IRequest;
