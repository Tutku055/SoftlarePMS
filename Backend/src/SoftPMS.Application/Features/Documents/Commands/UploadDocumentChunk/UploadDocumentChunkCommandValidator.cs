using FluentValidation;

namespace SoftPMS.Application.Features.Documents.Commands.UploadDocumentChunk;

public class UploadDocumentChunkCommandValidator : AbstractValidator<UploadDocumentChunkCommand>
{
    public UploadDocumentChunkCommandValidator()
    {
    }
}
