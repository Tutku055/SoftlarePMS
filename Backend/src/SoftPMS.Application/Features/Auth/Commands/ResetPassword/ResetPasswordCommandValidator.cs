using FluentValidation;
using SoftPMS.Application.Common.Extensions;

namespace SoftPMS.Application.Features.Auth.Commands.ResetPassword;

/// <summary>Validates payload and password complexity for ResetPasswordCommand.</summary>
public sealed class ResetPasswordCommandValidator : AbstractValidator<ResetPasswordCommand>
{
    public ResetPasswordCommandValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email is required.")
            .EmailAddress().WithMessage("A valid email address is required.");

        RuleFor(x => x.Token)
            .NotEmpty().WithMessage("Reset token is required.");

        RuleFor(x => x.NewPassword)
            .ApplyPasswordRules();
    }
}

