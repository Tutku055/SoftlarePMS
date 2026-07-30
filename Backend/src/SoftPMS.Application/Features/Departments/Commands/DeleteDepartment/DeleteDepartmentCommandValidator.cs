using FluentValidation;

namespace SoftPMS.Application.Features.Departments.Commands.DeleteDepartment;

public class DeleteDepartmentCommandValidator : AbstractValidator<DeleteDepartmentCommand>
{
    public DeleteDepartmentCommandValidator()
    {
        // Add rules here
    }
}
