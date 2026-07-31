using FluentValidation;

namespace SoftPMS.Application.Features.EmployeeNotes.Commands.CreateEmployeeNote;

public class CreateEmployeeNoteCommandValidator : AbstractValidator<CreateEmployeeNoteCommand>
{
    public CreateEmployeeNoteCommandValidator()
    {
        RuleFor(v => v.EmployeeId).NotEmpty();
        RuleFor(v => v.Dto).NotNull();
    }
}
