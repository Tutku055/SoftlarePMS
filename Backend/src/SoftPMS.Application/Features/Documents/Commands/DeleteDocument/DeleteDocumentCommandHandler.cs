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

        // Remove obsolete notifications for the deleted document
        var obsoleteNotifications = await context.UserNotifications
            .Where(n => n.Type == Domain.Enums.NotificationType.DocumentExpiry
                && !n.IsRead
                && n.Title.Contains(document.FileName))
            .ToListAsync(cancellationToken);

        if (obsoleteNotifications.Count > 0)
        {
            context.UserNotifications.RemoveRange(obsoleteNotifications);
        }

        context.Documents.Remove(document);
        await context.SaveChangesAsync(cancellationToken);

        return Unit.Value;
    }
}
