using FluentValidation;

namespace SoftPMS.Application.Features.Calendar.Queries.GetCalendarEventById;

public class GetCalendarEventByIdQueryValidator : AbstractValidator<GetCalendarEventByIdQuery>
{
    public GetCalendarEventByIdQueryValidator()
    {
        RuleFor(v => v.Id)
            .NotEmpty().WithMessage("Event Id is required.");
    }
}
