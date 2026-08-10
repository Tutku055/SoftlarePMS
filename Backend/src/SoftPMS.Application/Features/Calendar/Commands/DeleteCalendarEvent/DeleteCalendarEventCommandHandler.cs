using MediatR;
using Microsoft.EntityFrameworkCore;
using SoftPMS.Application.Common.Interfaces;
using SoftPMS.Domain.Entities;
using SoftPMS.Domain.Exceptions;

namespace SoftPMS.Application.Features.Calendar.Commands.DeleteCalendarEvent;

public class DeleteCalendarEventCommandHandler : IRequestHandler<DeleteCalendarEventCommand, Unit>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public DeleteCalendarEventCommandHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<Unit> Handle(DeleteCalendarEventCommand request, CancellationToken cancellationToken)
    {
        var calendarEvent = await _context.CalendarEvents
            .FirstOrDefaultAsync(e => e.Id == request.Id, cancellationToken);

        if (calendarEvent == null)
        {
            throw new NotFoundException(nameof(CalendarEvent), request.Id);
        }

        var isSuperAdmin = _currentUserService.Permissions.Contains("SuperAdmin", StringComparer.OrdinalIgnoreCase);
        var isConfidential = calendarEvent.VisibilityLevel == Domain.Enums.VisibilityLevel.Confidential;

        if (isConfidential)
        {
            var canDeleteConfidential = isSuperAdmin ||
                _currentUserService.Permissions.Contains("Calendar.DeleteConfidentialEvents", StringComparer.OrdinalIgnoreCase);

            if (!canDeleteConfidential)
            {
                throw new ForbiddenAccessException("You do not have permission to delete confidential calendar events.");
            }
        }
        else
        {
            var canDeleteStandard = isSuperAdmin ||
                _currentUserService.Permissions.Contains("Calendar.DeleteEvent", StringComparer.OrdinalIgnoreCase);

            if (!canDeleteStandard)
            {
                throw new ForbiddenAccessException("You do not have permission to delete standard calendar events.");
            }
        }

        // Fix: Remove any orphan reminder tracker rows for this event before deletion.
        // The tracker key pattern for physical events is "PHYS_EVENT_{Id}_{Date}".
        // We search by prefix so we catch any tracker regardless of the date suffix.
        var trackerPrefix = $"PHYS_EVENT_{calendarEvent.Id}_";
        var orphanTrackers = await _context.EventReminderTrackers
            .Where(t => t.ReferenceKey.StartsWith(trackerPrefix))
            .ToListAsync(cancellationToken);

        if (orphanTrackers.Count > 0)
        {
            _context.EventReminderTrackers.RemoveRange(orphanTrackers);
        }

        _context.CalendarEvents.Remove(calendarEvent);
        await _context.SaveChangesAsync(cancellationToken);

        return Unit.Value;
    }
}
