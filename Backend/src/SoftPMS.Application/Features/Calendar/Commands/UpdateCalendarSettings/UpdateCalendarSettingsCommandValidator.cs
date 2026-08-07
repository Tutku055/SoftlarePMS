using FluentValidation;

namespace SoftPMS.Application.Features.Calendar.Commands.UpdateCalendarSettings;

public class UpdateCalendarSettingsCommandValidator : AbstractValidator<UpdateCalendarSettingsCommand>
{
    public UpdateCalendarSettingsCommandValidator()
    {
        RuleFor(x => x.HolidayCountryCode)
            .NotEmpty().WithMessage("Holiday country code is required.")
            .MaximumLength(10).WithMessage("Holiday country code cannot exceed 10 characters.");

        RuleFor(x => x.HolidayReminderDays)
            .GreaterThanOrEqualTo(0).WithMessage("Holiday reminder days must be non-negative.");

        RuleFor(x => x.BirthdayReminderDays)
            .GreaterThanOrEqualTo(0).WithMessage("Birthday reminder days must be non-negative.");
    }
}
