using FluentValidation;

namespace SoftPMS.Application.Features.Payrolls.Commands.CalculatePayroll;

public class CalculatePayrollCommandValidator : AbstractValidator<CalculatePayrollCommand>
{
    public CalculatePayrollCommandValidator()
    {
        RuleFor(v => v.Year).GreaterThan(2000);
        RuleFor(v => v.Month).InclusiveBetween(1, 12);
        RuleFor(v => v.EmployeeId).NotEmpty();
    }
}
