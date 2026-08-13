using FluentValidation;

namespace SoftPMS.Application.Features.SystemSettings.Commands.TestEmailConnection;

public class TestEmailConnectionCommandValidator : AbstractValidator<TestEmailConnectionCommand>
{
    public TestEmailConnectionCommandValidator()
    {
        RuleFor(x => x.SmtpHost)
            .NotEmpty().WithMessage("SMTP Host is required.");

        RuleFor(x => x.SmtpPort)
            .GreaterThan(0).WithMessage("SMTP Port must be a valid port number.");

        RuleFor(x => x.SenderName)
            .NotEmpty().WithMessage("Sender Name is required.");

        RuleFor(x => x.SenderEmail)
            .NotEmpty().WithMessage("Sender Email is required.")
            .EmailAddress().WithMessage("Sender Email must be a valid email address.");

    }
}
