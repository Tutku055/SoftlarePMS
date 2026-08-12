using MediatR;
using Microsoft.EntityFrameworkCore;
using SoftPMS.Application.Common.Interfaces;
using SoftPMS.Application.Features.Calendar.DTOs;
using SoftPMS.Domain.Entities;
using SoftPMS.Domain.Enums;
using SoftPMS.Domain.Exceptions;

namespace SoftPMS.Application.Features.Calendar.Queries.GetCalendarEventById;

public class GetCalendarEventByIdQueryHandler : IRequestHandler<GetCalendarEventByIdQuery, CalendarEventDto>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public GetCalendarEventByIdQueryHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<CalendarEventDto> Handle(GetCalendarEventByIdQuery request, CancellationToken cancellationToken)
    {
        var entity = await _context.CalendarEvents
            .Include(e => e.Department)
            .Include(e => e.User)
            .AsNoTracking()
            .FirstOrDefaultAsync(e => e.Id == request.Id, cancellationToken);

        if (entity == null)
        {
            throw new NotFoundException(nameof(CalendarEvent), request.Id);
        }

        if (entity.VisibilityLevel == VisibilityLevel.Confidential)
        {
            var userPermissions = _currentUserService.Permissions;
            var canReadConfidential = userPermissions.Contains("Calendar.ReadConfidentialEvents", StringComparer.OrdinalIgnoreCase) ||
                                      userPermissions.Contains("SuperAdmin", StringComparer.OrdinalIgnoreCase);

            if (!canReadConfidential && entity.UserId != _currentUserService.UserId)
            {
                throw new ForbiddenAccessException("You do not have permission to view this confidential event.");
            }
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
            EventType = ((int)entity.EventType == 0 || !Enum.IsDefined(typeof(CalendarEventType), entity.EventType))
                ? (entity.StartTime.Date != entity.EndTime.Date ? CalendarEventType.MultiDay : CalendarEventType.TimeBased)
                : entity.EventType,
            VisibilityLevel = entity.VisibilityLevel,
            DepartmentId = entity.DepartmentId,
            DepartmentName = entity.Department?.Name,
            UserId = entity.UserId,
            AuthorName = entity.User?.Username,
            CreatedAt = entity.CreatedAt
        };
    }
}
