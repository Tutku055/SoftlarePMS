using FluentValidation;

namespace SoftPMS.Application.Features.EmployeeAddresses.Commands.DeleteEmployeeAddress;

public class DeleteEmployeeAddressCommandValidator : AbstractValidator<DeleteEmployeeAddressCommand>
{
    public DeleteEmployeeAddressCommandValidator()
    {
        RuleFor(v => v.Id).NotEmpty().WithMessage("Id is required.");
        RuleFor(v => v.EmployeeId).NotEmpty().WithMessage("EmployeeId is required.");
    }
}
