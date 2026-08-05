using MediatR;
using SoftPMS.Application.Common.Interfaces;
using SoftPMS.Application.Features.Notifications.Services;
using SoftPMS.Domain.Entities;
using SoftPMS.Domain.Enums;

namespace SoftPMS.Application.Features.Documents.Commands.UploadDocumentChunk;

public sealed class UploadDocumentChunkCommandHandler(
    IApplicationDbContext context,
    IStorageService storageService,
    ICurrentUserService currentUserService,
    IPassiveNotificationEvaluator notificationEvaluator) : IRequestHandler<UploadDocumentChunkCommand, Guid?>
{
    public async Task<Guid?> Handle(UploadDocumentChunkCommand request, CancellationToken cancellationToken)
    {
        await storageService.AppendChunkAsync(request.UploadId, request.ChunkStream, cancellationToken);

        if (request.ChunkIndex == request.TotalChunks - 1)
        {
            var document = new Document
            {
                ReferenceId = request.ReferenceId,
                OwnerModule = request.OwnerModule,
                DocumentType = request.DocumentType,
                FileName = request.FileName,
                IssueDate = request.IssueDate,
                ExpiryDate = request.ExpiryDate,
                ReminderDate = request.ReminderDate,
                CreatedByUserId = currentUserService.UserId == Guid.Empty ? throw new UnauthorizedAccessException() : currentUserService.UserId
            };

            var relativePath = await storageService.CommitChunksAsync(
                request.UploadId,
                document.Id,
                request.FileName,
                cancellationToken);

            long fileSizeBytes = await storageService.GetFileSizeAsync(relativePath, cancellationToken);
            
            document.FilePath = relativePath;
            document.FileSizeBytes = fileSizeBytes;

            context.Documents.Add(document);
            await context.SaveChangesAsync(cancellationToken);

            if (request.ExpiryDate != null || request.ReminderDate != null)
            {
                await notificationEvaluator.EvaluateDocumentExpirationsAsync(cancellationToken);
            }

            return document.Id;
        }

        return null;
    }
}
