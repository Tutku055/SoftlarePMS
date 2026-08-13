using MediatR;
using SoftPMS.Domain.Enums;

namespace SoftPMS.Application.Features.Documents.Commands.UploadDocumentChunk;

/// <summary>
/// Represents the Command to upload document chunk.
/// </summary>
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
}


