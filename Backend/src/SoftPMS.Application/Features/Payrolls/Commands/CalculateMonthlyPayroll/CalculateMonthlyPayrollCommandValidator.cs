using FluentValidation;

namespace SoftPMS.Application.Features.Payrolls.Commands.CalculateMonthlyPayroll;

public class CalculateMonthlyPayrollCommandValidator : AbstractValidator<CalculateMonthlyPayrollCommand>
{
    public CalculateMonthlyPayrollCommandValidator()
    {
        // Add rules here
    }
}
