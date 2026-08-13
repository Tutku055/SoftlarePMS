using FluentValidation;

namespace SoftPMS.Application.Features.Payrolls.Commands.CalculatePayroll;

public class CalculateHourlySalaryCommandValidator : AbstractValidator<CalculateHourlySalaryCommand>
{
    public CalculateHourlySalaryCommandValidator()
    {
        RuleFor(v => v.EmployeeId).NotEmpty().WithMessage("EmployeeId is required.");
    }
}
