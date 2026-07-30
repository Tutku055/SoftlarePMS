using FluentValidation;

namespace SoftPMS.Application.Features.EmployeeCompensations.Commands.UpdateEmployeeCompensation;

public class UpdateEmployeeCompensationCommandValidator : AbstractValidator<UpdateEmployeeCompensationCommand>
{
    public UpdateEmployeeCompensationCommandValidator()
    {
        // Add rules here
    }
}
