using MediatR;
using Microsoft.EntityFrameworkCore;
using SoftPMS.Application.Common.Interfaces;
using SoftPMS.Application.Features.Notifications.Services;
using SoftPMS.Domain.Entities;
using SoftPMS.Domain.Enums;
using SoftPMS.Domain.Exceptions;

namespace SoftPMS.Application.Features.Calendar.Commands.UpdateCalendarEvent;

public class UpdateCalendarEventCommandHandler : IRequestHandler<UpdateCalendarEventCommand, Unit>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly ICalendarNotificationEvaluator _calendarNotificationEvaluator;

    public UpdateCalendarEventCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService,
        ICalendarNotificationEvaluator calendarNotificationEvaluator)
    {
        _context = context;
        _currentUserService = currentUserService;
        _calendarNotificationEvaluator = calendarNotificationEvaluator;
    }

    public async Task<Unit> Handle(UpdateCalendarEventCommand request, CancellationToken cancellationToken)
    {
        var calendarEvent = await _context.CalendarEvents
            .FirstOrDefaultAsync(e => e.Id == request.Id, cancellationToken);

        if (calendarEvent == null)
        {
            throw new NotFoundException(nameof(CalendarEvent), request.Id);
        }

        var isSuperAdmin = _currentUserService.Permissions.Contains("SuperAdmin", StringComparer.OrdinalIgnoreCase);
        var isConfidential = request.VisibilityLevel == VisibilityLevel.Confidential;
        var wasConfidential = calendarEvent.VisibilityLevel == VisibilityLevel.Confidential;

        if (isConfidential || wasConfidential)
        {
            var canUpdateConfidential = isSuperAdmin ||
                _currentUserService.Permissions.Contains("Calendar.UpdateConfidentialEvents", StringComparer.OrdinalIgnoreCase);

            if (!canUpdateConfidential)
            {
                throw new ForbiddenAccessException("You do not have permission to edit confidential calendar events.");
            }
        }
        else
        {
            var canUpdateStandard = isSuperAdmin ||
                _currentUserService.Permissions.Contains("Calendar.UpdateEvent", StringComparer.OrdinalIgnoreCase);

            if (!canUpdateStandard)
            {
                throw new ForbiddenAccessException("You do not have permission to edit standard calendar events.");
            }
        }

        // Fix: If the event's timing or threshold changes, the previous reminder tracker must be
        // removed so the evaluator will re-fire for the new schedule. Without this, once a tracker
        // is written the notification is never re-sent even after the date/threshold changes.
        var timingChanged = calendarEvent.StartTime != request.StartTime
                         || calendarEvent.EndTime != request.EndTime
                         || calendarEvent.ReminderThresholdDays != request.ReminderThresholdDays;

        if (timingChanged)
        {
            var oldTrackerKey = $"PHYS_EVENT_{calendarEvent.Id}_{calendarEvent.StartTime:yyyyMMdd}";
            var existingTracker = await _context.EventReminderTrackers
                .FirstOrDefaultAsync(t => t.ReferenceKey == oldTrackerKey, cancellationToken);

            if (existingTracker != null)
            {
                _context.EventReminderTrackers.Remove(existingTracker);
            }
        }

        var eventType = request.EventType;
        var tzOffsetMinutes = _currentUserService.TimezoneOffsetMinutes;
        var startLocal = request.StartTime.AddMinutes(tzOffsetMinutes).Date;
        var endLocal = request.EndTime.AddMinutes(tzOffsetMinutes).Date;

        if (eventType == CalendarEventType.MultiDay && startLocal == endLocal)
        {
            eventType = CalendarEventType.AllDay;
        }

        calendarEvent.Title = request.Title.Trim();
        calendarEvent.Description = request.Description?.Trim();
        calendarEvent.StartTime = request.StartTime;
        calendarEvent.EndTime = request.EndTime;
        calendarEvent.EventType = eventType;
        calendarEvent.ReminderThresholdDays = request.ReminderThresholdDays;
        calendarEvent.VisibilityLevel = request.VisibilityLevel;
        // Confidential/Private events cannot be emailed to employees
        calendarEvent.SendEmailReminder = !isConfidential && request.SendEmailReminder;
        calendarEvent.DepartmentId = isConfidential ? null : request.DepartmentId;

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

        return Unit.Value;
    }
}
