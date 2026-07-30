using FluentValidation;

namespace SoftPMS.Application.Features.Professions.Queries.GetProfessionsWithPagination;

public sealed class GetProfessionsWithPaginationQueryValidator : AbstractValidator<GetProfessionsWithPaginationQuery>
{
    public GetProfessionsWithPaginationQueryValidator()
    {
        RuleFor(x => x.PageNumber)
            .GreaterThanOrEqualTo(1).WithMessage("PageNumber at least greater than or equal to 1.");

        RuleFor(x => x.PageSize)
            .GreaterThanOrEqualTo(1).WithMessage("PageSize at least greater than or equal to 1.");
    }
}
