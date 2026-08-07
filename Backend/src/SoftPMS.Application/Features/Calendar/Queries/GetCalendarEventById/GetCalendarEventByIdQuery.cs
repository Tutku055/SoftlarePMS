using MediatR;
using Microsoft.EntityFrameworkCore;
using SoftPMS.Application.Common.Interfaces;
using SoftPMS.Application.Features.Calendar.DTOs;
using SoftPMS.Domain.Entities;
using SoftPMS.Domain.Exceptions;

namespace SoftPMS.Application.Features.Calendar.Queries.GetCalendarEventById;

public record GetCalendarEventByIdQuery(Guid Id) : IRequest<CalendarEventDto>;

public class GetCalendarEventByIdQueryHandler : IRequestHandler<GetCalendarEventByIdQuery, CalendarEventDto>
{
    private readonly IApplicationDbContext _context;

    public GetCalendarEventByIdQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<CalendarEventDto> Handle(GetCalendarEventByIdQuery request, CancellationToken cancellationToken)
    {
        var entity = await _context.CalendarEvents
            .AsNoTracking()
            .FirstOrDefaultAsync(e => e.Id == request.Id, cancellationToken);

        if (entity == null)
        {
            throw new NotFoundException(nameof(CalendarEvent), request.Id);
        }

        return new CalendarEventDto
        {
            Id = entity.Id,
            Title = entity.Title,
            Description = entity.Description,
            StartTime = entity.StartTime,
            EndTime = entity.EndTime,
            ReminderThresholdDays = entity.ReminderThresholdDays,
            SendEmailReminder = entity.SendEmailReminder,
            CreatedAt = entity.CreatedAt
        };
    }
}
