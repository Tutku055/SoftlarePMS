using FluentValidation;

namespace SoftPMS.Application.Features.EmployeeReferences.Commands.DeleteEmployeeReference;

public class DeleteEmployeeReferenceCommandValidator : AbstractValidator<DeleteEmployeeReferenceCommand>
{
    public DeleteEmployeeReferenceCommandValidator()
    {
        RuleFor(v => v.ReferenceId).NotEmpty();
    }
}
