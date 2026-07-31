using FluentValidation;

namespace SoftPMS.Application.Features.EmployeeReferences.Commands.CreateEmployeeReference;

public class CreateEmployeeReferenceCommandValidator : AbstractValidator<CreateEmployeeReferenceCommand>
{
    public CreateEmployeeReferenceCommandValidator()
    {
        RuleFor(v => v.EmployeeId).NotEmpty();
        RuleFor(v => v.Dto).NotNull();
    }
}
