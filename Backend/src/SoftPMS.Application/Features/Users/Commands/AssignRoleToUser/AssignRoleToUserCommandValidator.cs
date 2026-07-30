using FluentValidation;

namespace SoftPMS.Application.Features.Users.Commands.AssignRoleToUser;

public class AssignRoleToUserCommandValidator : AbstractValidator<AssignRoleToUserCommand>
{
    public AssignRoleToUserCommandValidator()
    {
        // Add rules here
    }
}
