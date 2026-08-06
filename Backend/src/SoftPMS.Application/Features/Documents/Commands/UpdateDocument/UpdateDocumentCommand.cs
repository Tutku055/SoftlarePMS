using MediatR;
using SoftPMS.Domain.Enums;

namespace SoftPMS.Application.Features.Documents.Commands.UpdateDocument;

public class UpdateDocumentCommand : IRequest
{
    public Guid Id { get; set; }
    public string FileName { get; set; } = string.Empty;
    public DocumentType DocumentType { get; set; }
    public DateTime? IssueDate { get; set; }
    public DateTime? ExpiryDate { get; set; }
}
