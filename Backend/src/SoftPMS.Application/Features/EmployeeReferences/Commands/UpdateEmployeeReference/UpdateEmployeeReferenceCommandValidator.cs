using FluentValidation;

namespace SoftPMS.Application.Features.EmployeeReferences.Commands.UpdateEmployeeReference;

public class UpdateEmployeeReferenceCommandValidator : AbstractValidator<UpdateEmployeeReferenceCommand>
{
    public UpdateEmployeeReferenceCommandValidator()
    {
        // Add rules here
    }
}
