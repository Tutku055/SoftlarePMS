using FluentValidation;

namespace SoftPMS.Application.Features.Timesheets.Commands.GenerateMonthlyTimesheet;

public class GenerateMonthlyTimesheetCommandValidator : AbstractValidator<GenerateMonthlyTimesheetCommand>
{
    public GenerateMonthlyTimesheetCommandValidator()
    {
        // Add rules here
    }
}
