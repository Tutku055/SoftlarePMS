using FluentValidation;

namespace SoftPMS.Application.Features.Timesheets.Commands.GenerateMonthlyTimesheet;

public class GenerateMonthlyTimesheetCommandValidator : AbstractValidator<GenerateMonthlyTimesheetCommand>
{
    public GenerateMonthlyTimesheetCommandValidator()
    {
        RuleFor(v => v.Year).GreaterThan(2000);
        RuleFor(v => v.Month).InclusiveBetween(1, 12);
    }
}
