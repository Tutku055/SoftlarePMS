using FluentValidation;

namespace SoftPMS.Application.Features.Calendar.Commands.DeleteCalendarNote;

public class DeleteCalendarNoteCommandValidator : AbstractValidator<DeleteCalendarNoteCommand>
{
    public DeleteCalendarNoteCommandValidator()
    {
        RuleFor(v => v.Id)
            .NotEmpty().WithMessage("Note Id is required.");
    }
}
