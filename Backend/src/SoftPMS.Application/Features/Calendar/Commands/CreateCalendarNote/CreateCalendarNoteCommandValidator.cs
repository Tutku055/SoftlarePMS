using FluentValidation;

namespace SoftPMS.Application.Features.Calendar.Commands.CreateCalendarNote;

public class CreateCalendarNoteCommandValidator : AbstractValidator<CreateCalendarNoteCommand>
{
    public CreateCalendarNoteCommandValidator()
    {
        RuleFor(x => x.NoteDate)
            .NotEmpty().WithMessage("Note date is required.");

        RuleFor(x => x.Content)
            .NotEmpty().WithMessage("Content is required.")
            .MaximumLength(2000).WithMessage("Content cannot exceed 2000 characters.");

        RuleFor(x => x.ColorCode)
            .NotEmpty().WithMessage("Color code is required.")
            .MaximumLength(30).WithMessage("Color code cannot exceed 30 characters.");

        RuleFor(x => x.VisibilityLevel)
            .IsInEnum().WithMessage("Invalid visibility level.");
    }
}
