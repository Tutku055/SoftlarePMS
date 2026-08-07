using FluentValidation;

namespace SoftPMS.Application.Features.Calendar.Queries.GetCalendarByDateRange;

public class GetCalendarByDateRangeQueryValidator : AbstractValidator<GetCalendarByDateRangeQuery>
{
    public GetCalendarByDateRangeQueryValidator()
    {
        RuleFor(x => x.StartDate)
            .NotEmpty().WithMessage("Start date is required.");

        RuleFor(x => x.EndDate)
            .NotEmpty().WithMessage("End date is required.")
            .Must((query, endDate) => endDate >= query.StartDate)
            .WithMessage("End date must be greater than or equal to start date.")
            .Must((query, endDate) => (endDate.DayNumber - query.StartDate.DayNumber) <= 100)
            .WithMessage("Date range cannot exceed 100 days.");
    }
}
