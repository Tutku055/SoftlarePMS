using FluentValidation;

namespace SoftPMS.Application.Features.Calendar.Commands.DeleteCalendarEvent;

public class DeleteCalendarEventCommandValidator : AbstractValidator<DeleteCalendarEventCommand>
{
    public DeleteCalendarEventCommandValidator()
    {
        RuleFor(v => v.Id)
            .NotEmpty().WithMessage("Event Id is required.");
    }
}
