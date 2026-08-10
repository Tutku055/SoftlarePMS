using FluentValidation;

namespace SoftPMS.Application.Features.Calendar.Queries.GetCalendarSettings;

public class GetCalendarSettingsQueryValidator : AbstractValidator<GetCalendarSettingsQuery>
{
    public GetCalendarSettingsQueryValidator()
    {
        // No parameters to validate
    }
}
