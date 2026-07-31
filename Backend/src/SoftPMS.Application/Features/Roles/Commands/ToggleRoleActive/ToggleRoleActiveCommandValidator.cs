using FluentValidation;

namespace SoftPMS.Application.Features.Roles.Commands.ToggleRoleActive;

public class ToggleRoleActiveCommandValidator : AbstractValidator<ToggleRoleActiveCommand>
{
    public ToggleRoleActiveCommandValidator()
    {
        RuleFor(v => v.Id).NotEmpty();
    }
}
