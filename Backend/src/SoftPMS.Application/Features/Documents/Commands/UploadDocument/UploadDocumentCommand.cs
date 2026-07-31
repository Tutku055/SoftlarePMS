using MediatR;
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
