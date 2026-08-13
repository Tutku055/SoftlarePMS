using MediatR;

namespace SoftPMS.Application.Features.EmployeeNotes.Commands.DeleteEmployeeNote;

/// <summary>
/// Represents the Command to delete employee note.
/// </summary>
public record DeleteEmployeeNoteCommand(Guid NoteId) : IRequest;


