using FluentValidation;

namespace SoftPMS.Application.Features.Calendar.Queries.GetCalendarNoteById;

public class GetCalendarNoteByIdQueryValidator : AbstractValidator<GetCalendarNoteByIdQuery>
{
    public GetCalendarNoteByIdQueryValidator()
    {
        RuleFor(v => v.Id)
            .NotEmpty().WithMessage("Note Id is required.");
    }
}
