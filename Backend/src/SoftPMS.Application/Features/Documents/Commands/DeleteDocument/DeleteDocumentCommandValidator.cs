using FluentValidation;

namespace SoftPMS.Application.Features.Documents.Commands.DeleteDocument;

public class DeleteDocumentCommandValidator : AbstractValidator<DeleteDocumentCommand>
{
    public DeleteDocumentCommandValidator()
    {
    }
}
