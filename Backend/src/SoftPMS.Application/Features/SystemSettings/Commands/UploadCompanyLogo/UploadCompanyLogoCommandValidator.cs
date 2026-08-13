using FluentValidation;

namespace SoftPMS.Application.Features.SystemSettings.Commands.UploadCompanyLogo;

public class UploadCompanyLogoCommandValidator : AbstractValidator<UploadCompanyLogoCommand>
{
    public UploadCompanyLogoCommandValidator()
    {
        RuleFor(x => x.FileStream)
            .NotNull().WithMessage("File stream is required.")
            .Must(s => s != null && s.Length > 0 && s.Length <= 5 * 1024 * 1024)
            .WithMessage("File is required and must not exceed 5MB.");

        RuleFor(x => x.FileName)
            .NotEmpty().WithMessage("File name is required.");
    }
}
