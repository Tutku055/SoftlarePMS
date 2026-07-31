using FluentValidation;

namespace SoftPMS.Application.Features.Roles.Commands.AssignPermissionsToRole;

public class AssignPermissionsToRoleCommandValidator : AbstractValidator<AssignPermissionsToRoleCommand>
{
    public AssignPermissionsToRoleCommandValidator()
    {
        RuleFor(v => v.RoleId).NotEmpty();
        RuleFor(v => v.PermissionIds).NotNull();
    }
}
