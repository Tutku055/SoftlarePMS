using FluentValidation;
using SoftPMS.Domain.Enums;

namespace SoftPMS.Application.Features.Calendar.Commands.UpdateCalendarEvent;

public class UpdateCalendarEventCommandValidator : AbstractValidator<UpdateCalendarEventCommand>
{
    public UpdateCalendarEventCommandValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("Event Id is required.");

        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Title is required.")
            .MaximumLength(200).WithMessage("Title cannot exceed 200 characters.");

        RuleFor(x => x.Description)
            .MaximumLength(2000).WithMessage("Description cannot exceed 2000 characters.")
            .When(x => !string.IsNullOrEmpty(x.Description));

        RuleFor(x => x.EventType)
            .IsInEnum().WithMessage("Invalid event type.");

        RuleFor(x => x.EndTime)
            .GreaterThanOrEqualTo(x => x.StartTime)
            .WithMessage("End time must be greater than or equal to start time.")
            .Must((cmd, endTime) =>
            {
                if (cmd.EventType == CalendarEventType.TimeBased || cmd.EventType == CalendarEventType.AllDay)
                {
                    return endTime.Date == cmd.StartTime.Date;
                }
                return true;
            }).WithMessage("Time-based and All-Day events must start and end on the same day.")
            .Must((cmd, endTime) =>
            {
                if (cmd.EventType == CalendarEventType.MultiDay)
                {
                    return endTime.Date > cmd.StartTime.Date;
                }
                return true;
            }).WithMessage("Multi-Day events must span multiple days.");

        RuleFor(x => x.ReminderThresholdDays)
            .GreaterThanOrEqualTo(0)
            .WithMessage("Reminder threshold days must be non-negative.");
    }
}
