using FluentValidation;

namespace SoftPMS.Application.Features.Employees.Commands.DeleteEmployee;

public class DeleteEmployeeCommandValidator : AbstractValidator<DeleteEmployeeCommand>
{
    public DeleteEmployeeCommandValidator()
    {
        RuleFor(v => v.EmployeeId).NotEmpty();
    }
}
