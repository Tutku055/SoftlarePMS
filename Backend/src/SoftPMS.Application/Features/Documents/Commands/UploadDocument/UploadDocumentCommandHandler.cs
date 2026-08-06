using MediatR;
using SoftPMS.Application.Common.Interfaces;
using SoftPMS.Application.Features.Notifications.Services;
using SoftPMS.Domain.Entities;
using SoftPMS.Domain.Enums;

namespace SoftPMS.Application.Features.Documents.Commands.UploadDocument;

public sealed class UploadDocumentCommandHandler(
    IApplicationDbContext context,
    IStorageService storageService,
    ICurrentUserService currentUserService,
    IPassiveNotificationEvaluator notificationEvaluator) : IRequestHandler<UploadDocumentCommand, Guid>
{
    public async Task<Guid> Handle(UploadDocumentCommand request, CancellationToken cancellationToken)
    {
        var document = new Document
        {
            ReferenceId = request.ReferenceId,
            OwnerModule = request.OwnerModule,
            DocumentType = request.DocumentType,
            FileName = request.FileName,
            FileSizeBytes = request.FileLength,
            IssueDate = request.IssueDate,
            ExpiryDate = request.ExpiryDate,
            CreatedByUserId = currentUserService.UserId == Guid.Empty ? throw new UnauthorizedAccessException() : currentUserService.UserId
        };

        var relativePath = await storageService.UploadAsync(
            document.Id,
            request.FileStream, 
            request.FileName,
            cancellationToken);

        document.FilePath = relativePath;

        context.Documents.Add(document);
        await context.SaveChangesAsync(cancellationToken);

        if (request.ExpiryDate != null)
        {
            await notificationEvaluator.EvaluateDocumentExpirationsAsync(cancellationToken);
        }

        return document.Id;
    }
}
