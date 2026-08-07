using FluentValidation;

namespace SoftPMS.Application.Features.AuditLogs.Queries.GetAuditLogDetailsByCorrelationId;

public sealed class GetAuditLogDetailsByCorrelationIdQueryValidator : AbstractValidator<GetAuditLogDetailsByCorrelationIdQuery>
{
    public GetAuditLogDetailsByCorrelationIdQueryValidator()
    {
        RuleFor(x => x.CorrelationId)
            .NotEmpty().WithMessage("Correlation ID is required.");

        RuleFor(x => x.PageNumber)
            .GreaterThanOrEqualTo(1).WithMessage("PageNumber at least greater than or equal to 1.");

        RuleFor(x => x.PageSize)
            .GreaterThanOrEqualTo(1).WithMessage("PageSize at least greater than or equal to 1.")
            .LessThanOrEqualTo(200).WithMessage("PageSize cannot exceed 200 items per page.");
    }
}
