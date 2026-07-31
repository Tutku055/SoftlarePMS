using FluentValidation;

namespace SoftPMS.Application.Features.EmployeeReferences.Commands.UpdateEmployeeReference;

public class UpdateEmployeeReferenceCommandValidator : AbstractValidator<UpdateEmployeeReferenceCommand>
{
    public UpdateEmployeeReferenceCommandValidator()
    {
        RuleFor(v => v.ReferenceId).NotEmpty();
        RuleFor(v => v.Dto).NotNull();
    }
}
