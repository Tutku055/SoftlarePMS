using FluentValidation;

namespace SoftPMS.Application.Features.EmployeeNotes.Commands.UpdateEmployeeNote;

public class UpdateEmployeeNoteCommandValidator : AbstractValidator<UpdateEmployeeNoteCommand>
{
    public UpdateEmployeeNoteCommandValidator()
    {
        // Add rules here
    }
}
