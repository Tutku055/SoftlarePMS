using FluentValidation;

namespace SoftPMS.Application.Features.Documents.Commands.DownloadDocument;

public class DownloadDocumentCommandValidator : AbstractValidator<DownloadDocumentCommand>
{
    public DownloadDocumentCommandValidator()
    {
        RuleFor(v => v.Id).NotEmpty().WithMessage("Id is required.");
    }
}
