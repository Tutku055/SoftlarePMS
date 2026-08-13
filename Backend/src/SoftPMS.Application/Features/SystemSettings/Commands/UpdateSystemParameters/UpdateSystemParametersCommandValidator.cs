using FluentValidation;

namespace SoftPMS.Application.Features.SystemSettings.Commands.UpdateSystemParameters;

public class UpdateSystemParametersCommandValidator : AbstractValidator<UpdateSystemParametersCommand>
{
    public UpdateSystemParametersCommandValidator()
    {
        RuleFor(x => x.CompanyName)
            .NotEmpty().WithMessage("Company Name is required.");

        RuleFor(x => x.EmployeeNoPrefix)
            .NotEmpty().WithMessage("Employee number prefix is required.")
            .MaximumLength(10).WithMessage("Prefix must not exceed 10 characters.");

        RuleFor(x => x.GoLiveYear)
            .GreaterThan(2000).WithMessage("Go-Live Year must be a valid year (e.g., 2026).");

        RuleFor(x => x.MonthlyWorkingHours)
            .GreaterThan(0).WithMessage("Monthly working hours must be greater than 0.");

        RuleFor(x => x.DailyWorkingHours)
            .GreaterThan(0).WithMessage("Daily working hours must be greater than 0.");

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
