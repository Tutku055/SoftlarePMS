using MediatR;
using Microsoft.EntityFrameworkCore;
using SoftPMS.Application.Common.Interfaces;
using SoftPMS.Application.Features.Calendar.DTOs;
using SoftPMS.Domain.Entities;
using SoftPMS.Domain.Enums;
using SoftPMS.Domain.Exceptions;

namespace SoftPMS.Application.Features.Calendar.Queries.GetCalendarNoteById;

public record GetCalendarNoteByIdQuery(Guid Id) : IRequest<CalendarNoteDto>;

public class GetCalendarNoteByIdQueryHandler : IRequestHandler<GetCalendarNoteByIdQuery, CalendarNoteDto>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public GetCalendarNoteByIdQueryHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<CalendarNoteDto> Handle(GetCalendarNoteByIdQuery request, CancellationToken cancellationToken)
    {
        var note = await _context.CalendarNotes
            .Include(n => n.User)
            .AsNoTracking()
            .FirstOrDefaultAsync(n => n.Id == request.Id, cancellationToken);

        if (note == null)
        {
            throw new NotFoundException(nameof(CalendarNote), request.Id);
        }

        var isOwner = _currentUserService.UserId == note.UserId;
        var hasConfidentialAccess = _currentUserService.Permissions.Contains("Calendar.ReadConfidentialNotes", StringComparer.OrdinalIgnoreCase) ||
                                    _currentUserService.Permissions.Contains("SuperAdmin", StringComparer.OrdinalIgnoreCase);

        if (note.VisibilityLevel == VisibilityLevel.Confidential && !isOwner && !hasConfidentialAccess)
        {
            throw new ForbiddenAccessException("You do not have permission to view this confidential note.");
        }

        return new CalendarNoteDto
        {
            Id = note.Id,
            UserId = note.UserId,
            AuthorName = note.User != null ? note.User.Username : null,
            NoteDate = note.NoteDate,
            Content = note.Content,
            ColorCode = note.ColorCode,
            VisibilityLevel = note.VisibilityLevel,
            CreatedAt = note.CreatedAt
        };
    }
}
