using FluentValidation;

namespace SoftPMS.Application.Features.EmployeeCompensations.Commands.EditEmployeeCompensation;

public class EditEmployeeCompensationCommandValidator : AbstractValidator<EditEmployeeCompensationCommand>
{
    public EditEmployeeCompensationCommandValidator()
    {
        RuleFor(v => v.Id)
            .NotEmpty().WithMessage("Compensation Id is required.");
            
        RuleFor(v => v.EmployeeId)
            .NotEmpty().WithMessage("Employee Id is required.");

        RuleFor(v => v.BaseSalary)
            .GreaterThan(0).WithMessage("Base Salary must be greater than 0.");

        RuleFor(v => v.SalaryType)
            .IsInEnum().WithMessage("Valid Salary Type is required.");

        RuleFor(v => v.Currency)
            .IsInEnum().WithMessage("Valid Currency is required.");

        RuleFor(v => v.EffectiveDate)
            .NotEmpty().WithMessage("Effective Date is required.");
    }
}
