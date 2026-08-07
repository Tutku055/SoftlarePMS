using MediatR;
using Microsoft.EntityFrameworkCore;
using SoftPMS.Application.Common.Interfaces;
using SoftPMS.Domain.Entities;
using SoftPMS.Domain.Exceptions;

namespace SoftPMS.Application.Features.Calendar.Commands.UpdateCalendarEvent;

public record UpdateCalendarEventCommand(
    Guid Id,
    string Title,
    string? Description,
    DateTimeOffset StartTime,
    DateTimeOffset EndTime,
    int ReminderThresholdDays,
    bool SendEmailReminder
) : IRequest<Unit>;

public class UpdateCalendarEventCommandHandler : IRequestHandler<UpdateCalendarEventCommand, Unit>
{
    private readonly IApplicationDbContext _context;

    public UpdateCalendarEventCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Unit> Handle(UpdateCalendarEventCommand request, CancellationToken cancellationToken)
    {
        var calendarEvent = await _context.CalendarEvents
            .FirstOrDefaultAsync(e => e.Id == request.Id, cancellationToken);

        if (calendarEvent == null)
        {
            throw new NotFoundException(nameof(CalendarEvent), request.Id);
        }

        calendarEvent.Title = request.Title.Trim();
        calendarEvent.Description = request.Description?.Trim();
        calendarEvent.StartTime = request.StartTime;
        calendarEvent.EndTime = request.EndTime;
        calendarEvent.ReminderThresholdDays = request.ReminderThresholdDays;
        calendarEvent.SendEmailReminder = request.SendEmailReminder;

        await _context.SaveChangesAsync(cancellationToken);

        return Unit.Value;
    }
}
