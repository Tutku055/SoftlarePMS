using FluentValidation;

namespace SoftPMS.Application.Features.Employees.Commands.UpdateEmployeeRate;

/// <summary>FluentValidation rules for UpdateEmployeeRateCommand.</summary>
public sealed class UpdateEmployeeRateCommandValidator : AbstractValidator<UpdateEmployeeRateCommand>
{
    public UpdateEmployeeRateCommandValidator()
    {
        RuleFor(x => x.EmployeeId)
            .NotEmpty().WithMessage("Employee ID is required.");

        RuleFor(x => x.BaseSalary)
            .GreaterThan(0).WithMessage("Base salary (Stundenlohn) must be greater than 0.");

        RuleFor(x => x.NewEffectiveDate)
            .NotEmpty().WithMessage("New effective date is required.");
    }
}
