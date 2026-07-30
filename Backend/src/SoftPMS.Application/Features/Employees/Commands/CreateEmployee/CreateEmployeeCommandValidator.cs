using FluentValidation;

namespace SoftPMS.Application.Features.Employees.Commands.CreateEmployee;

/// <summary>FluentValidation rules for CreateEmployeeCommand.</summary>
public sealed class CreateEmployeeCommandValidator : AbstractValidator<CreateEmployeeCommand>
{
    public CreateEmployeeCommandValidator()
    {
        // Identity
        RuleFor(x => x.EmployeeNo)
            .NotEmpty().WithMessage("Employee number is required.")
            .MaximumLength(20).WithMessage("Employee number must not exceed 20 characters.");

        RuleFor(x => x.FirstName)
            .NotEmpty().WithMessage("First name is required.")
            .MaximumLength(50).WithMessage("First name must not exceed 50 characters.");

        RuleFor(x => x.LastName)
            .NotEmpty().WithMessage("Last name is required.")
            .MaximumLength(50).WithMessage("Last name must not exceed 50 characters.");

        RuleFor(x => x.Nationality)
            .NotEmpty().WithMessage("Nationality is required.");

        RuleFor(x => x.Profession)
            .NotEmpty().WithMessage("Profession is required.");

        // Dates
        RuleFor(x => x.DateOfBirth)
            .LessThan(DateTime.UtcNow.AddYears(-16))
            .WithMessage("Employee must be at least 16 years old.");

        RuleFor(x => x.HireDate)
            .NotEmpty().WithMessage("Hire date is required.");

        // Work conditions
        RuleFor(x => x.WorkingHoursPerWeek)
            .GreaterThan(0).WithMessage("Working hours per week must be greater than 0.")
            .LessThanOrEqualTo(60).WithMessage("Working hours per week must not exceed 60.");

        RuleFor(x => x.AnnualVacationDays)
            .GreaterThanOrEqualTo(0).WithMessage("Annual vacation days cannot be negative.");
            
        RuleFor(x => x.CarriedOverLeaves)
            .GreaterThanOrEqualTo(0).WithMessage("Carried over leaves cannot be negative.");

        // Initial address
        RuleFor(x => x.AddressLine)
            .NotEmpty().WithMessage("Address line is required.")
            .MaximumLength(200).WithMessage("Address line must not exceed 200 characters.");

        RuleFor(x => x.City)
            .NotEmpty().WithMessage("City is required.")
            .MaximumLength(100).WithMessage("City must not exceed 100 characters.");

        RuleFor(x => x.Country)
            .NotEmpty().WithMessage("Country is required.")
            .MaximumLength(100).WithMessage("Country must not exceed 100 characters.");
    }
}
