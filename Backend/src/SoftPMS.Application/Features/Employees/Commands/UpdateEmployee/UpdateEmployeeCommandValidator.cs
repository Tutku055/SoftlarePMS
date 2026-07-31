using FluentValidation;

namespace SoftPMS.Application.Features.Employees.Commands.UpdateEmployee;

/// <summary>FluentValidation rules for UpdateEmployeeCommand.</summary>
public sealed class UpdateEmployeeCommandValidator : AbstractValidator<UpdateEmployeeCommand>
{
    public UpdateEmployeeCommandValidator()
    {
        RuleFor(x => x.EmployeeId)
            .NotEmpty().WithMessage("Employee ID is required.");

        RuleFor(x => x.FirstName)
            .NotEmpty().WithMessage("First name is required.")
            .MaximumLength(50).WithMessage("First name must not exceed 50 characters.");

        RuleFor(x => x.LastName)
            .NotEmpty().WithMessage("Last name is required.")
            .MaximumLength(50).WithMessage("Last name must not exceed 50 characters.");

        RuleFor(x => x.Nationality)
            .NotEmpty().WithMessage("Nationality is required.");

        RuleFor(x => x.WorkingHoursPerWeek)
            .GreaterThan(0).WithMessage("Working hours must be greater than 0.")
            .LessThanOrEqualTo(60).WithMessage("Working hours must not exceed 60 per week.");

        RuleFor(x => x.AnnualVacationDays)
            .GreaterThanOrEqualTo(0).WithMessage("Annual vacation days cannot be negative.");

        RuleFor(x => x.CarriedOverLeaves)
            .GreaterThanOrEqualTo(0).WithMessage("Carried over leaves cannot be negative.");

    }
}
