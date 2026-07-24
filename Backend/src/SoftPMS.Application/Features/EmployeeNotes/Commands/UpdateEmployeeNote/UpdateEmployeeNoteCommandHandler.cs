using AutoMapper;
using MediatR;
using SoftPMS.Application.Common.Interfaces;
using SoftPMS.Domain.Entities;
using SoftPMS.Domain.Exceptions;

namespace SoftPMS.Application.Features.EmployeeNotes.Commands.UpdateEmployeeNote;

public sealed class UpdateEmployeeNoteCommandHandler(
    IApplicationDbContext context,
    IMapper mapper,
    ICurrentUserService currentUserService) : IRequestHandler<UpdateEmployeeNoteCommand>
{
    public async Task Handle(UpdateEmployeeNoteCommand request, CancellationToken cancellationToken)
    {
        var note = await context.EmployeeNotes.FindAsync(new object[] { request.NoteId }, cancellationToken);
        if (note == null)
            throw new NotFoundException(nameof(EmployeeNote), request.NoteId);

        // Check if the note is being made confidential, or if it was confidential and they are modifying it without permission
        bool changingConfidentialityToTrue = request.Dto.IsConfidential && !note.IsConfidential;

        if (changingConfidentialityToTrue)
        {
            if (!currentUserService.Permissions.Contains("EmployeeNotes.ManageConfidentiality"))
            {
                throw new ForbiddenAccessException("You do not have permission to manage confidentiality of notes.");
            }
        }

        // Also check if it's already confidential, the user can only read/update if they have ReadConfidential or they created it
        if (note.IsConfidential && !currentUserService.Permissions.Contains("EmployeeNotes.ReadConfidential") && note.CreatedByUserId != currentUserService.UserId)
        {
            throw new ForbiddenAccessException("You do not have permission to update this confidential note.");
        }

        mapper.Map(request.Dto, note);
        await context.SaveChangesAsync(cancellationToken);
    }
}
