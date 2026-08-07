using FluentValidation;

namespace SoftPMS.Application.Features.AuditLogs.Queries.GetAuditLogsWithPagination;

public sealed class GetAuditLogsWithPaginationQueryValidator
    : AbstractValidator<GetAuditLogsWithPaginationQuery>
{
    private const int MaxPageSize = 200;

    public GetAuditLogsWithPaginationQueryValidator()
    {
        RuleFor(x => x.PageNumber)
            .GreaterThanOrEqualTo(1)
            .WithMessage("Page number must be greater than or equal to 1.");

        RuleFor(x => x.PageSize)
            .GreaterThanOrEqualTo(1)
            .WithMessage("Page size must be greater than or equal to 1.")
            .LessThanOrEqualTo(MaxPageSize)
            .WithMessage($"Page size must not exceed {MaxPageSize}.");
    }
}
