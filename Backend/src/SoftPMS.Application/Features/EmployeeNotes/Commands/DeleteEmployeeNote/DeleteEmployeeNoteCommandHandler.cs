using MediatR;
using SoftPMS.Application.Common.Interfaces;
using SoftPMS.Domain.Entities;
using SoftPMS.Domain.Exceptions;

namespace SoftPMS.Application.Features.EmployeeNotes.Commands.DeleteEmployeeNote;

public sealed class DeleteEmployeeNoteCommandHandler(
    IApplicationDbContext context,
    ICurrentUserService currentUserService) : IRequestHandler<DeleteEmployeeNoteCommand>
{
    public async Task Handle(DeleteEmployeeNoteCommand request, CancellationToken cancellationToken)
    {
        var note = await context.EmployeeNotes.FindAsync(new object[] { request.NoteId }, cancellationToken);
        if (note == null)
            throw new NotFoundException(nameof(EmployeeNote), request.NoteId);

        if (note.IsConfidential && !currentUserService.Permissions.Contains("EmployeeNotes.ReadConfidential") && note.CreatedByUserId != currentUserService.UserId)
        {
            throw new ForbiddenAccessException("You do not have permission to delete this confidential note.");
        }

        context.EmployeeNotes.Remove(note);
        await context.SaveChangesAsync(cancellationToken);
    }
}
