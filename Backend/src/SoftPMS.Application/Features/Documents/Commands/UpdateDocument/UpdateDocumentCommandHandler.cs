using MediatR;
using Microsoft.EntityFrameworkCore;
using SoftPMS.Application.Common.Interfaces;
using SoftPMS.Application.Features.Notifications.Services;
using SoftPMS.Domain.Entities;
using SoftPMS.Domain.Exceptions;

namespace SoftPMS.Application.Features.Documents.Commands.UpdateDocument;

public sealed class UpdateDocumentCommandHandler(
    IApplicationDbContext context,
    IPassiveNotificationEvaluator notificationEvaluator) : IRequestHandler<UpdateDocumentCommand>
{
    public async Task Handle(UpdateDocumentCommand request, CancellationToken cancellationToken)
    {
        var document = await context.Documents
            .FirstOrDefaultAsync(d => d.Id == request.Id, cancellationToken);

        if (document == null)
            throw new NotFoundException(nameof(Document), request.Id);

        document.FileName = request.FileName;
        document.DocumentType = request.DocumentType;
        document.IssueDate = request.IssueDate;
        document.ExpiryDate = request.ExpiryDate;

        await context.SaveChangesAsync(cancellationToken);

        // Immediately evaluate document expirations so notifications are fresh
        await notificationEvaluator.EvaluateDocumentExpirationsAsync(cancellationToken);
    }
}
