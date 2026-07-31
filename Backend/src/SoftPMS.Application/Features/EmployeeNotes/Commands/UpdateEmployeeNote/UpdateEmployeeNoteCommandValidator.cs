using FluentValidation;

namespace SoftPMS.Application.Features.EmployeeNotes.Commands.UpdateEmployeeNote;

public class UpdateEmployeeNoteCommandValidator : AbstractValidator<UpdateEmployeeNoteCommand>
{
    public UpdateEmployeeNoteCommandValidator()
    {
        RuleFor(v => v.NoteId).NotEmpty();
        RuleFor(v => v.Dto).NotNull();
    }
}
