using FluentValidation;

namespace SoftPMS.Application.Features.EmployeeCompensations.Commands.UpdateEmployeeCompensation;

public class UpdateEmployeeCompensationCommandValidator : AbstractValidator<UpdateEmployeeCompensationCommand>
{
    public UpdateEmployeeCompensationCommandValidator()
    {
        RuleFor(v => v.EmployeeId).NotEmpty();
        RuleFor(v => v.BaseSalary).GreaterThanOrEqualTo(0);
    }
}
