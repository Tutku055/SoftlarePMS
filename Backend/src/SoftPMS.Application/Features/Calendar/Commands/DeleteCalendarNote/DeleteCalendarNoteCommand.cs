using MediatR;
using Microsoft.EntityFrameworkCore;
using SoftPMS.Application.Common.Interfaces;
using SoftPMS.Domain.Entities;
using SoftPMS.Domain.Exceptions;

namespace SoftPMS.Application.Features.Calendar.Commands.DeleteCalendarNote;

public record DeleteCalendarNoteCommand(Guid Id) : IRequest<Unit>;

public class DeleteCalendarNoteCommandHandler : IRequestHandler<DeleteCalendarNoteCommand, Unit>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public DeleteCalendarNoteCommandHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<Unit> Handle(DeleteCalendarNoteCommand request, CancellationToken cancellationToken)
    {
        var note = await _context.CalendarNotes
            .FirstOrDefaultAsync(n => n.Id == request.Id, cancellationToken);

        if (note == null)
        {
            throw new NotFoundException(nameof(CalendarNote), request.Id);
        }

        var isOwner = _currentUserService.UserId == note.UserId;
        var isSuperAdmin = _currentUserService.Permissions.Contains("SuperAdmin", StringComparer.OrdinalIgnoreCase);

        if (!isOwner && !isSuperAdmin)
        {
            throw new ForbiddenAccessException("You can only delete your own calendar notes.");
        }

        var isConfidential = note.VisibilityLevel == Domain.Enums.VisibilityLevel.Confidential;

        if (isConfidential)
        {
            var canDeleteConfidential = isSuperAdmin ||
                _currentUserService.Permissions.Contains("Calendar.DeleteConfidentialNotes", StringComparer.OrdinalIgnoreCase);

            if (!canDeleteConfidential)
            {
                throw new ForbiddenAccessException("You do not have permission to delete confidential calendar notes.");
            }
        }
        else
        {
            var canDeleteStandard = isSuperAdmin ||
                _currentUserService.Permissions.Contains("Calendar.DeleteNote", StringComparer.OrdinalIgnoreCase);

            if (!canDeleteStandard)
            {
                throw new ForbiddenAccessException("You do not have permission to delete standard calendar notes.");
            }
        }

        _context.CalendarNotes.Remove(note);
        await _context.SaveChangesAsync(cancellationToken);

        return Unit.Value;
    }
}
