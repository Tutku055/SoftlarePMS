using FluentValidation;

namespace SoftPMS.Application.Features.EmployeeNotes.Commands.DeleteEmployeeNote;

public class DeleteEmployeeNoteCommandValidator : AbstractValidator<DeleteEmployeeNoteCommand>
{
    public DeleteEmployeeNoteCommandValidator()
    {
        // Add rules here
    }
}
