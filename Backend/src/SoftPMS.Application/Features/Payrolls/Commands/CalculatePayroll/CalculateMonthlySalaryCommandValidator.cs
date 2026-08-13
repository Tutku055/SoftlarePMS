using FluentValidation;

namespace SoftPMS.Application.Features.Payrolls.Commands.CalculatePayroll;

public class CalculateMonthlySalaryCommandValidator : AbstractValidator<CalculateMonthlySalaryCommand>
{
    public CalculateMonthlySalaryCommandValidator()
    {
        RuleFor(v => v.EmployeeId).NotEmpty().WithMessage("EmployeeId is required.");
    }
}
