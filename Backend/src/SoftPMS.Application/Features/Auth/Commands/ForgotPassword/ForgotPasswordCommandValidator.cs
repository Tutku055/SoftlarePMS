using FluentValidation;

namespace SoftPMS.Application.Features.Auth.Commands.ForgotPassword;

/// <summary>Validates the email format for ForgotPasswordCommand.</summary>
public sealed class ForgotPasswordCommandValidator : AbstractValidator<ForgotPasswordCommand>
{
    public ForgotPasswordCommandValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email is required.")
            .EmailAddress().WithMessage("A valid email address is required.")
            .MaximumLength(150).WithMessage("Email must not exceed 150 characters.");
    }
}
