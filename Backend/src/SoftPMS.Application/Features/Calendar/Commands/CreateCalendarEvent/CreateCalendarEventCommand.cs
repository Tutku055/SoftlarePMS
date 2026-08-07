using MediatR;
using SoftPMS.Application.Common.Interfaces;
using SoftPMS.Domain.Entities;

namespace SoftPMS.Application.Features.Calendar.Commands.CreateCalendarEvent;

public record CreateCalendarEventCommand(
    string Title,
    string? Description,
    DateTimeOffset StartTime,
    DateTimeOffset EndTime,
    int ReminderThresholdDays,
    bool SendEmailReminder
) : IRequest<Guid>;

public class CreateCalendarEventCommandHandler : IRequestHandler<CreateCalendarEventCommand, Guid>
{
    private readonly IApplicationDbContext _context;

    public CreateCalendarEventCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Guid> Handle(CreateCalendarEventCommand request, CancellationToken cancellationToken)
    {
        var calendarEvent = new CalendarEvent
        {
            Title = request.Title.Trim(),
            Description = request.Description?.Trim(),
            StartTime = request.StartTime,
            EndTime = request.EndTime,
            ReminderThresholdDays = request.ReminderThresholdDays,
            SendEmailReminder = request.SendEmailReminder,
            CreatedAt = DateTime.UtcNow
        };

        _context.CalendarEvents.Add(calendarEvent);
        await _context.SaveChangesAsync(cancellationToken);

        return calendarEvent.Id;
    }
}
