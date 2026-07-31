using MediatR;
using Microsoft.EntityFrameworkCore;
using SoftPMS.Domain.Exceptions;
using SoftPMS.Application.Common.Interfaces;
using SoftPMS.Domain.Entities;

namespace SoftPMS.Application.Features.Documents.Commands.DeleteDocument;

public sealed class DeleteDocumentCommandHandler(
    IApplicationDbContext context, 
    IStorageService storageService) : IRequestHandler<DeleteDocumentCommand, Unit>
{
    public async Task<Unit> Handle(DeleteDocumentCommand request, CancellationToken cancellationToken)
    {
        var document = await context.Documents
            .FirstOrDefaultAsync(d => d.Id == request.Id, cancellationToken);

        if (document == null)
            throw new NotFoundException(nameof(Document), request.Id);

        await storageService.DeleteAsync(document.FilePath, cancellationToken);

        context.Documents.Remove(document);
        await context.SaveChangesAsync(cancellationToken);

        return Unit.Value;
    }
}
