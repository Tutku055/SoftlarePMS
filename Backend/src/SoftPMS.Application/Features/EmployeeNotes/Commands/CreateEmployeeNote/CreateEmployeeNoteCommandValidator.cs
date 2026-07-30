using FluentValidation;

namespace SoftPMS.Application.Features.EmployeeNotes.Commands.CreateEmployeeNote;

public class CreateEmployeeNoteCommandValidator : AbstractValidator<CreateEmployeeNoteCommand>
{
    public CreateEmployeeNoteCommandValidator()
    {
        // Add rules here
    }
}
