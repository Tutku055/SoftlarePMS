using MediatR;

using SoftPMS.Application.Common.Interfaces;
using SoftPMS.Domain.Entities;
using SoftPMS.Domain.Enums;

namespace SoftPMS.Application.Features.Documents.Commands.UploadDocument;

public class UploadDocumentCommand : IRequest<Guid>
{
    public Stream FileStream { get; set; } = null!;
    public string FileName { get; set; } = string.Empty;
    public long FileLength { get; set; }
    public Guid ReferenceId { get; set; }
    public DocumentModule OwnerModule { get; set; }
    public DocumentType DocumentType { get; set; }
    public DateTime? IssueDate { get; set; }
    public DateTime? ExpiryDate { get; set; }
    public DateTime? ReminderDate { get; set; }
}

public class UploadDocumentCommandHandler : IRequestHandler<UploadDocumentCommand, Guid>
{
    private readonly IApplicationDbContext _context;
    private readonly IStorageService _storageService;
    private readonly ICurrentUserService _currentUserService;

    public UploadDocumentCommandHandler(
        IApplicationDbContext context,
        IStorageService storageService,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _storageService = storageService;
        _currentUserService = currentUserService;
    }

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
            ReminderDate = request.ReminderDate,
            CreatedByUserId = _currentUserService.UserId == Guid.Empty ? throw new UnauthorizedAccessException() : _currentUserService.UserId
        };

        var relativePath = await _storageService.UploadAsync(
            document.Id,
            request.FileStream, 
            request.FileName,
            cancellationToken);

        document.FilePath = relativePath;

        _context.Documents.Add(document);
        await _context.SaveChangesAsync(cancellationToken);

        return document.Id;
    }
}
