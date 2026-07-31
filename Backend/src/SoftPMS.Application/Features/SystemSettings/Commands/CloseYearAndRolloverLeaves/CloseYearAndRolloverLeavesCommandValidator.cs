using FluentValidation;

namespace SoftPMS.Application.Features.SystemSettings.Commands.CloseYearAndRolloverLeaves;

public class CloseYearAndRolloverLeavesCommandValidator : AbstractValidator<CloseYearAndRolloverLeavesCommand>
{
    public CloseYearAndRolloverLeavesCommandValidator()
    {
        RuleFor(v => v.YearToClose).GreaterThan(2000);
    }
}
