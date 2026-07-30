using FluentValidation;

namespace SoftPMS.Application.Features.Timesheets.Commands.UpdateTimesheetEntry;

public class UpdateTimesheetEntryCommandValidator : AbstractValidator<UpdateTimesheetEntryCommand>
{
    public UpdateTimesheetEntryCommandValidator()
    {
        RuleFor(x => x.OvertimeTypeId)
            .NotNull()
            .When(x => x.OvertimeHours > 0)
            .WithMessage("An Overtime Type must be selected if Overtime Hours are greater than 0.");
            
        RuleFor(x => x.OvertimeTypeId)
            .Null()
            .When(x => x.OvertimeHours == 0)
            .WithMessage("Overtime Type should not be set when there are no Overtime Hours.");
    }
}
