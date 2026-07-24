using MediatR;

namespace SoftPMS.Application.Features.EmployeeNotes.Commands.DeleteEmployeeNote;

public record DeleteEmployeeNoteCommand(Guid NoteId) : IRequest;
