using FluentValidation;

namespace SoftPMS.Application.Features.EmployeeCompensations.Commands.UpdateEmployeeCompensation;

public class UpdateEmployeeCompensationCommandValidator : AbstractValidator<UpdateEmployeeCompensationCommand>
{
    public UpdateEmployeeCompensationCommandValidator()
    {
        RuleFor(v => v.EmployeeId).NotEmpty();
        RuleFor(v => v.BaseSalary).GreaterThanOrEqualTo(0);
        RuleFor(v => v.SalaryType).IsInEnum().WithMessage("Valid Salary Type is required.");
        RuleFor(v => v.Currency).IsInEnum().WithMessage("Valid Currency is required.");
    }
}
