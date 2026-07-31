using FluentValidation;

namespace SoftPMS.Application.Features.EmployeeNotes.Commands.DeleteEmployeeNote;

public class DeleteEmployeeNoteCommandValidator : AbstractValidator<DeleteEmployeeNoteCommand>
{
    public DeleteEmployeeNoteCommandValidator()
    {
        RuleFor(v => v.NoteId).NotEmpty();
    }
}
