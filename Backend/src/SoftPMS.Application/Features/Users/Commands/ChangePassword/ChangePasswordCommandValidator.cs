using FluentValidation;

namespace SoftPMS.Application.Features.Users.Commands.ChangePassword;

public class ChangePasswordCommandValidator : AbstractValidator<ChangePasswordCommand>
{
    public ChangePasswordCommandValidator()
    {
        RuleFor(v => v.OldPassword).NotEmpty();
        RuleFor(v => v.NewPassword).NotEmpty();
    }
}
