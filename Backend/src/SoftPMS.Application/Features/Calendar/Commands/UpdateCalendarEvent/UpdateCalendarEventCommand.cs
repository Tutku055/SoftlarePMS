using MediatR;
using Microsoft.EntityFrameworkCore;
using SoftPMS.Application.Common.Interfaces;
using SoftPMS.Application.Features.Notifications.Services;
using SoftPMS.Domain.Entities;
using SoftPMS.Domain.Enums;
using SoftPMS.Domain.Exceptions;

namespace SoftPMS.Application.Features.Calendar.Commands.UpdateCalendarEvent;

/// <summary>
/// Represents the Command to update calendar event.
/// </summary>
public record UpdateCalendarEventCommand(
    Guid Id,
    string Title,
    string? Description,
    DateTimeOffset StartTime,
    DateTimeOffset EndTime,
    int ReminderThresholdDays,
    bool SendEmailReminder,
    CalendarEventType EventType = CalendarEventType.TimeBased,
    Guid? DepartmentId = null,
    VisibilityLevel VisibilityLevel = VisibilityLevel.Standard
) : IRequest<Unit>;



