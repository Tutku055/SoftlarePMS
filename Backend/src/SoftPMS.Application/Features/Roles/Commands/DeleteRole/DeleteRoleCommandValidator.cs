using FluentValidation;

namespace SoftPMS.Application.Features.Roles.Commands.DeleteRole;

public class DeleteRoleCommandValidator : AbstractValidator<DeleteRoleCommand>
{
    public DeleteRoleCommandValidator()
    {
        RuleFor(v => v.Id).NotEmpty();
    }
}
