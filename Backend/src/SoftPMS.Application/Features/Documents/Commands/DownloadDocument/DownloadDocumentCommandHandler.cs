using MediatR;
using SoftPMS.Application.Common.Interfaces;
using SoftPMS.Application.Features.Documents.DTOs;
using SoftPMS.Domain.Entities;
using SoftPMS.Domain.Exceptions;

namespace SoftPMS.Application.Features.Documents.Commands.DownloadDocument;

public sealed class DownloadDocumentCommandHandler(
    IApplicationDbContext context,
    IStorageService storageService) : IRequestHandler<DownloadDocumentCommand, DocumentDownloadDto?>
{
    public async Task<DocumentDownloadDto?> Handle(DownloadDocumentCommand request, CancellationToken cancellationToken)
    {
        var document = await context.Documents.FindAsync(new object[] { request.Id }, cancellationToken);
        if (document == null)
            throw new NotFoundException(nameof(Document), request.Id);

        var exists = await storageService.FileExistsAsync(document.FilePath, cancellationToken);
        
        if (document.IsAvailable != exists)
        {
            document.IsAvailable = exists;
            await context.SaveChangesAsync(cancellationToken);
        }

        if (!exists)
            return null;

        var stream = await storageService.DownloadAsync(document.FilePath, cancellationToken);

        return new DocumentDownloadDto
        {
            Stream = stream,
            FileName = document.FileName
        };
    }
}
