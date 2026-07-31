using FluentValidation;

namespace SoftPMS.Application.Features.Timesheets.Commands.ToggleTimesheetLock;

public class ToggleTimesheetLockCommandValidator : AbstractValidator<ToggleTimesheetLockCommand>
{
    public ToggleTimesheetLockCommandValidator()
    {
        RuleFor(x => x.EmployeeId)
            .NotEmpty().WithMessage("EmployeeId is required.");

        RuleFor(x => x.Year)
            .GreaterThan(2000).WithMessage("Year must be valid.");

        RuleFor(x => x.Month)
            .InclusiveBetween(1, 12).WithMessage("Month must be between 1 and 12.");
    }
}
