using FluentValidation;

namespace SoftPMS.Application.Features.Permissions.Commands.DeletePermission;

public class DeletePermissionCommandValidator : AbstractValidator<DeletePermissionCommand>
{
    public DeletePermissionCommandValidator()
    {
        // Add rules here
    }
}
