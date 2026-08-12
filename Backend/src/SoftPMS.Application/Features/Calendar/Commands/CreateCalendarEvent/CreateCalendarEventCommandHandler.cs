using MediatR;
using SoftPMS.Application.Common.Interfaces;
using SoftPMS.Application.Features.Notifications.Services;
using SoftPMS.Domain.Entities;
using SoftPMS.Domain.Enums;
using SoftPMS.Domain.Exceptions;

namespace SoftPMS.Application.Features.Calendar.Commands.CreateCalendarEvent;

public class CreateCalendarEventCommandHandler : IRequestHandler<CreateCalendarEventCommand, Guid>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly ICalendarNotificationEvaluator _calendarNotificationEvaluator;

    public CreateCalendarEventCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService,
        ICalendarNotificationEvaluator calendarNotificationEvaluator)
    {
        _context = context;
        _currentUserService = currentUserService;
        _calendarNotificationEvaluator = calendarNotificationEvaluator;
    }

    public async Task<Guid> Handle(CreateCalendarEventCommand request, CancellationToken cancellationToken)
    {
        var isSuperAdmin = _currentUserService.Permissions.Contains("SuperAdmin", StringComparer.OrdinalIgnoreCase);
        var isConfidential = request.VisibilityLevel == VisibilityLevel.Confidential;

        if (isConfidential)
        {
            var canCreateConfidential = isSuperAdmin ||
                _currentUserService.Permissions.Contains("Calendar.CreateConfidentialEvents", StringComparer.OrdinalIgnoreCase);

            if (!canCreateConfidential)
            {
                throw new ForbiddenAccessException("You do not have permission to create confidential calendar events.");
            }
        }
        else
        {
            var canCreateStandard = isSuperAdmin ||
                _currentUserService.Permissions.Contains("Calendar.CreateEvent", StringComparer.OrdinalIgnoreCase);

            if (!canCreateStandard)
            {
                throw new ForbiddenAccessException("You do not have permission to create standard calendar events.");
            }
        }

        var currentUserId = _currentUserService.IsAuthenticated && _currentUserService.UserId != Guid.Empty
            ? (Guid?)_currentUserService.UserId
            : null;

        var eventType = request.EventType;
        var tzOffsetMinutes = _currentUserService.TimezoneOffsetMinutes;
        var startLocal = request.StartTime.AddMinutes(tzOffsetMinutes).Date;
        var endLocal = request.EndTime.AddMinutes(tzOffsetMinutes).Date;

        if ((int)eventType == 0 || !Enum.IsDefined(typeof(CalendarEventType), eventType))
        {
            eventType = startLocal != endLocal ? CalendarEventType.MultiDay : CalendarEventType.TimeBased;
        }

        if (eventType == CalendarEventType.MultiDay && startLocal == endLocal)
        {
            eventType = CalendarEventType.AllDay;
        }

        var calendarEvent = new CalendarEvent
        {
            Title = request.Title.Trim(),
            Description = request.Description?.Trim(),
            StartTime = request.StartTime,
            EndTime = request.EndTime,
            EventType = eventType,
            ReminderThresholdDays = request.ReminderThresholdDays,
            // Confidential/Private events cannot be emailed to employees
            SendEmailReminder = !isConfidential && request.SendEmailReminder,
            VisibilityLevel = request.VisibilityLevel,
            DepartmentId = isConfidential ? null : request.DepartmentId,
            UserId = currentUserId,
            CreatedAt = DateTime.UtcNow
        };

        _context.CalendarEvents.Add(calendarEvent);
        await _context.SaveChangesAsync(cancellationToken);

        // Immediate reminder evaluation to instantly stage in-app notifications and outbox emails if within threshold
        try
        {
            await _calendarNotificationEvaluator.EvaluateCalendarRemindersAsync(cancellationToken);
        }
        catch
        {
            // Non-blocking: background service will still pick up on next evaluation tick
        }

        return calendarEvent.Id;
    }
}
