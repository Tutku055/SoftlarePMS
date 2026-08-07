using MediatR;
using Microsoft.EntityFrameworkCore;
using SoftPMS.Application.Common.Interfaces;
using SoftPMS.Domain.Entities;
using SoftPMS.Domain.Exceptions;

namespace SoftPMS.Application.Features.Calendar.Commands.DeleteCalendarEvent;

public record DeleteCalendarEventCommand(Guid Id) : IRequest<Unit>;

public class DeleteCalendarEventCommandHandler : IRequestHandler<DeleteCalendarEventCommand, Unit>
{
    private readonly IApplicationDbContext _context;

    public DeleteCalendarEventCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Unit> Handle(DeleteCalendarEventCommand request, CancellationToken cancellationToken)
    {
        var calendarEvent = await _context.CalendarEvents
            .FirstOrDefaultAsync(e => e.Id == request.Id, cancellationToken);

        if (calendarEvent == null)
        {
            throw new NotFoundException(nameof(CalendarEvent), request.Id);
        }

        _context.CalendarEvents.Remove(calendarEvent);
        await _context.SaveChangesAsync(cancellationToken);

        return Unit.Value;
    }
}
