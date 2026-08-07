using FluentValidation;

namespace SoftPMS.Application.Features.Calendar.Commands.CreateCalendarEvent;

public class CreateCalendarEventCommandValidator : AbstractValidator<CreateCalendarEventCommand>
{
    public CreateCalendarEventCommandValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Title is required.")
            .MaximumLength(200).WithMessage("Title cannot exceed 200 characters.");

        RuleFor(x => x.Description)
            .MaximumLength(2000).WithMessage("Description cannot exceed 2000 characters.")
            .When(x => !string.IsNullOrEmpty(x.Description));

        RuleFor(x => x.EndTime)
            .GreaterThanOrEqualTo(x => x.StartTime)
            .WithMessage("End time must be greater than or equal to start time.");

        RuleFor(x => x.ReminderThresholdDays)
            .GreaterThanOrEqualTo(0)
            .WithMessage("Reminder threshold days must be non-negative.");
    }
}
