using FluentValidation;

namespace SoftPMS.Application.Features.Roles.Commands.AssignPermissionsToRole;

public class AssignPermissionsToRoleCommandValidator : AbstractValidator<AssignPermissionsToRoleCommand>
{
    public AssignPermissionsToRoleCommandValidator()
    {
        // Add rules here
    }
}
