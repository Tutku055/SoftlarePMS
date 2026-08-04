using FluentValidation;

namespace SoftPMS.Application.Features.EmployeeAddresses.Commands.CreateEmployeeAddress;

public sealed class CreateEmployeeAddressCommandValidator : AbstractValidator<CreateEmployeeAddressCommand>
{
    public CreateEmployeeAddressCommandValidator()
    {
        RuleFor(x => x.EmployeeId)
            .NotEmpty().WithMessage("Employee ID is required.");

        RuleFor(x => x.Dto)
            .NotNull().WithMessage("Address details are required.");

        RuleFor(x => x.Dto.AddressLine)
            .NotEmpty().WithMessage("Address line is required.")
            .MaximumLength(200).WithMessage("Address line must not exceed 200 characters.");

        RuleFor(x => x.Dto.City)
            .NotEmpty().WithMessage("City is required.")
            .MaximumLength(100).WithMessage("City must not exceed 100 characters.");

        RuleFor(x => x.Dto.Country)
            .NotEmpty().WithMessage("Country is required.")
            .MaximumLength(100).WithMessage("Country must not exceed 100 characters.");

        RuleFor(x => x.Dto.State)
            .MaximumLength(100).WithMessage("State must not exceed 100 characters.");

        RuleFor(x => x.Dto.PostalCode)
            .MaximumLength(20).WithMessage("Postal code must not exceed 20 characters.");

        RuleFor(x => x.Dto.StartDate)
            .NotEmpty().WithMessage("Start date is required.");

        RuleFor(x => x.Dto)
            .Must(dto => !dto.EndDate.HasValue || dto.EndDate.Value.Date >= dto.StartDate.Date)
            .WithMessage("End date must be greater than or equal to start date.")
            .When(x => x.Dto != null && x.Dto.EndDate.HasValue);
    }
}
