using MediatR;

using SoftPMS.Application.Common.Interfaces;
using SoftPMS.Domain.Entities;
using SoftPMS.Domain.Enums;

namespace SoftPMS.Application.Features.Documents.Commands.UploadDocumentChunk;

public class UploadDocumentChunkCommand : IRequest<Guid?>
{
    public Stream ChunkStream { get; set; } = null!;
    public string UploadId { get; set; } = string.Empty;
    public int ChunkIndex { get; set; }
    public int TotalChunks { get; set; }
    
    public string FileName { get; set; } = string.Empty;
    public Guid ReferenceId { get; set; }
    public DocumentModule OwnerModule { get; set; }
    public DocumentType DocumentType { get; set; }
    public DateTime? IssueDate { get; set; }
    public DateTime? ExpiryDate { get; set; }
    public DateTime? ReminderDate { get; set; }
}

public class UploadDocumentChunkCommandHandler : IRequestHandler<UploadDocumentChunkCommand, Guid?>
{
    private readonly IApplicationDbContext _context;
    private readonly IStorageService _storageService;
    private readonly ICurrentUserService _currentUserService;

    public UploadDocumentChunkCommandHandler(
        IApplicationDbContext context,
        IStorageService storageService,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _storageService = storageService;
        _currentUserService = currentUserService;
    }

    public async Task<Guid?> Handle(UploadDocumentChunkCommand request, CancellationToken cancellationToken)
    {
        await _storageService.AppendChunkAsync(request.UploadId, request.ChunkStream, cancellationToken);

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
                CreatedByUserId = _currentUserService.UserId == Guid.Empty ? throw new UnauthorizedAccessException() : _currentUserService.UserId
            };

            var relativePath = await _storageService.CommitChunksAsync(
                request.UploadId,
                document.Id,
                request.FileName,
                cancellationToken);

            long fileSizeBytes = await _storageService.GetFileSizeAsync(relativePath, cancellationToken);
            
            document.FilePath = relativePath;
            document.FileSizeBytes = fileSizeBytes;

            _context.Documents.Add(document);
            await _context.SaveChangesAsync(cancellationToken);

            return document.Id;
        }

        return null;
    }
}
