using FluentValidation;

namespace SoftPMS.Application.Features.Permissions.Commands.DeletePermission;

public class DeletePermissionCommandValidator : AbstractValidator<DeletePermissionCommand>
{
    public DeletePermissionCommandValidator()
    {
        RuleFor(v => v.Id).NotEmpty();
    }
}
