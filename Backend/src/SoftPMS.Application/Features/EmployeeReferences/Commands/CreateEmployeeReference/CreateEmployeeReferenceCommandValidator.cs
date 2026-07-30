using FluentValidation;

namespace SoftPMS.Application.Features.EmployeeReferences.Commands.CreateEmployeeReference;

public class CreateEmployeeReferenceCommandValidator : AbstractValidator<CreateEmployeeReferenceCommand>
{
    public CreateEmployeeReferenceCommandValidator()
    {
        // Add rules here
    }
}
