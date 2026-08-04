using FluentValidation;
using SoftPMS.Application.Common.Extensions;

namespace SoftPMS.Application.Features.Users.Commands.ChangePassword;

public class ChangePasswordCommandValidator : AbstractValidator<ChangePasswordCommand>
{
    public ChangePasswordCommandValidator()
    {
        RuleFor(v => v.OldPassword)
            .NotEmpty().WithMessage("Old password is required.");

        RuleFor(v => v.NewPassword)
            .ApplyPasswordRules();
    }
}

