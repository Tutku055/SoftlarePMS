using FluentValidation;

namespace SoftPMS.Application.Features.EmployeeCompensations.Commands.DeleteEmployeeCompensation;

public class DeleteEmployeeCompensationCommandValidator : AbstractValidator<DeleteEmployeeCompensationCommand>
{
    public DeleteEmployeeCompensationCommandValidator()
    {
        RuleFor(v => v.Id).NotEmpty();
    }
}
