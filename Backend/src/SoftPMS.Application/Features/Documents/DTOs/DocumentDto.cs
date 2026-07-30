using SoftPMS.Domain.Enums;

namespace SoftPMS.Application.Features.Documents.DTOs;

public class DocumentDto
{
    public Guid Id { get; set; }
    public Guid ReferenceId { get; set; }
    public DocumentModule OwnerModule { get; set; }
    public DocumentType DocumentType { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string FilePath { get; set; } = string.Empty;
    public long FileSizeBytes { get; set; }
    public DateTime? IssueDate { get; set; }
    public DateTime? ExpiryDate { get; set; }
    public DateTime? ReminderDate { get; set; }
    public Guid CreatedByUserId { get; set; }
    public DateTime CreatedAt { get; set; }
    public bool IsAvailable { get; set; }
    public DateTime? LastCheckedAt { get; set; }
}
