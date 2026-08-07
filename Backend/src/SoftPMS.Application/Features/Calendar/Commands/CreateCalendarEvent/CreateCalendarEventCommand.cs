using MediatR;
using SoftPMS.Application.Common.Interfaces;
using SoftPMS.Application.Features.Notifications.Services;
using SoftPMS.Domain.Entities;
using SoftPMS.Domain.Enums;
using SoftPMS.Domain.Exceptions;

namespace SoftPMS.Application.Features.Calendar.Commands.CreateCalendarEvent;

public record CreateCalendarEventCommand(
    string Title,
    string? Description,
    DateTimeOffset StartTime,
    DateTimeOffset EndTime,
    int ReminderThresholdDays,
    bool SendEmailReminder,
    Guid? DepartmentId = null,
    VisibilityLevel VisibilityLevel = VisibilityLevel.Standard
) : IRequest<Guid>;

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

        var calendarEvent = new CalendarEvent
        {
            Title = request.Title.Trim(),
            Description = request.Description?.Trim(),
            StartTime = request.StartTime,
            EndTime = request.EndTime,
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
