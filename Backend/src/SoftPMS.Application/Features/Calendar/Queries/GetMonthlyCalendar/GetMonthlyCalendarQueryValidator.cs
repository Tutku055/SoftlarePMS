using FluentValidation;

namespace SoftPMS.Application.Features.Calendar.Queries.GetMonthlyCalendar;

public class GetMonthlyCalendarQueryValidator : AbstractValidator<GetMonthlyCalendarQuery>
{
    public GetMonthlyCalendarQueryValidator()
    {
        RuleFor(x => x.Year)
            .InclusiveBetween(1900, 2100)
            .WithMessage("Year must be between 1900 and 2100.");

        RuleFor(x => x.Month)
            .InclusiveBetween(1, 12)
            .WithMessage("Month must be between 1 and 12.");
    }
}
