using MediatR;
using SoftPMS.Application.Common.Interfaces;
using SoftPMS.Domain.Entities;
using SoftPMS.Domain.Enums;
using SoftPMS.Domain.Exceptions;

namespace SoftPMS.Application.Features.Calendar.Commands.CreateCalendarNote;

public record CreateCalendarNoteCommand(
    DateOnly NoteDate,
    string Content,
    string ColorCode,
    VisibilityLevel VisibilityLevel
) : IRequest<Guid>;

public class CreateCalendarNoteCommandHandler : IRequestHandler<CreateCalendarNoteCommand, Guid>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public CreateCalendarNoteCommandHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<Guid> Handle(CreateCalendarNoteCommand request, CancellationToken cancellationToken)
    {
        if (!_currentUserService.IsAuthenticated || _currentUserService.UserId == Guid.Empty)
        {
            throw new UnauthorizedException("User must be authenticated to create a calendar note.");
        }

        var isSuperAdmin = _currentUserService.Permissions.Contains("SuperAdmin", StringComparer.OrdinalIgnoreCase);
        var isConfidential = request.VisibilityLevel == VisibilityLevel.Confidential;

        if (isConfidential)
        {
            var canCreateConfidential = isSuperAdmin ||
                _currentUserService.Permissions.Contains("Calendar.CreateConfidentialNotes", StringComparer.OrdinalIgnoreCase);

            if (!canCreateConfidential)
            {
                throw new ForbiddenAccessException("You do not have permission to create confidential calendar notes.");
            }
        }
        else
        {
            var canCreateStandard = isSuperAdmin ||
                _currentUserService.Permissions.Contains("Calendar.CreateNote", StringComparer.OrdinalIgnoreCase);

            if (!canCreateStandard)
            {
                throw new ForbiddenAccessException("You do not have permission to create standard calendar notes.");
            }
        }

        var note = new CalendarNote
        {
            UserId = _currentUserService.UserId,
            NoteDate = request.NoteDate,
            Content = request.Content.Trim(),
            ColorCode = string.IsNullOrWhiteSpace(request.ColorCode) ? "#3B82F6" : request.ColorCode.Trim(),
            VisibilityLevel = request.VisibilityLevel,
            CreatedAt = DateTime.UtcNow
        };

        _context.CalendarNotes.Add(note);
        await _context.SaveChangesAsync(cancellationToken);

        return note.Id;
    }
}
