using FluentValidation;

namespace SoftPMS.Application.Features.OvertimeTypes.Queries.GetOvertimeTypesWithPagination;

public class GetOvertimeTypesWithPaginationQueryValidator : AbstractValidator<GetOvertimeTypesWithPaginationQuery>
{
    public GetOvertimeTypesWithPaginationQueryValidator()
    {
        RuleFor(x => x.PageNumber)
            .GreaterThanOrEqualTo(1).WithMessage("PageNumber at least greater than or equal to 1.");

        RuleFor(x => x.PageSize)
            .GreaterThanOrEqualTo(1).WithMessage("PageSize at least greater than or equal to 1.");
    }
}
