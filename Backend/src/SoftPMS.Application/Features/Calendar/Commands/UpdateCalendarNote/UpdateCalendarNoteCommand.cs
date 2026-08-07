using MediatR;
using Microsoft.EntityFrameworkCore;
using SoftPMS.Application.Common.Interfaces;
using SoftPMS.Domain.Entities;
using SoftPMS.Domain.Enums;
using SoftPMS.Domain.Exceptions;

namespace SoftPMS.Application.Features.Calendar.Commands.UpdateCalendarNote;

public record UpdateCalendarNoteCommand(
    Guid Id,
    DateOnly NoteDate,
    string Content,
    string ColorCode,
    VisibilityLevel VisibilityLevel
) : IRequest<Unit>;

public class UpdateCalendarNoteCommandHandler : IRequestHandler<UpdateCalendarNoteCommand, Unit>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public UpdateCalendarNoteCommandHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<Unit> Handle(UpdateCalendarNoteCommand request, CancellationToken cancellationToken)
    {
        var note = await _context.CalendarNotes
            .FirstOrDefaultAsync(n => n.Id == request.Id, cancellationToken);

        if (note == null)
        {
            throw new NotFoundException(nameof(CalendarNote), request.Id);
        }

        var isOwner = _currentUserService.UserId == note.UserId;
        var isSuperAdmin = _currentUserService.Permissions.Contains("SuperAdmin");

        if (!isOwner && !isSuperAdmin)
        {
            throw new ForbiddenAccessException("You can only modify your own calendar notes.");
        }

        note.NoteDate = request.NoteDate;
        note.Content = request.Content.Trim();
        note.ColorCode = string.IsNullOrWhiteSpace(request.ColorCode) ? "#3B82F6" : request.ColorCode.Trim();
        note.VisibilityLevel = request.VisibilityLevel;

        await _context.SaveChangesAsync(cancellationToken);

        return Unit.Value;
    }
}
