using FluentValidation;

namespace SoftPMS.Application.Features.Timesheets.Commands.UpdateTimesheetEntry;

public class UpdateTimesheetEntryCommandValidator : AbstractValidator<UpdateTimesheetEntryCommand>
{
    public UpdateTimesheetEntryCommandValidator()
    {
        // Add rules here
    }
}
