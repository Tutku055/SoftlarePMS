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
    CalendarEventType EventType = CalendarEventType.TimeBased,
    Guid? DepartmentId = null,
    VisibilityLevel VisibilityLevel = VisibilityLevel.Standard
) : IRequest<Guid>;

