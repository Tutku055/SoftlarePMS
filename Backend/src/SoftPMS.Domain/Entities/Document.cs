using SoftPMS.Domain.Enums;

namespace SoftPMS.Domain.Entities;

public class Document : BaseEntity
{
    public Guid ReferenceId { get; set; }

    public DocumentModule OwnerModule { get; set; } = DocumentModule.Employee;

    public DocumentType DocumentType { get; set; } = DocumentType.Other;

    public string FileName { get; set; } = string.Empty;

    public string FilePath { get; set; } = string.Empty;

    public long FileSizeBytes { get; set; }

    public DateTime? IssueDate { get; set; }

    public DateTime? ExpiryDate { get; set; }

    public Guid CreatedByUserId { get; set; }

    public bool IsAvailable { get; set; } = true;

    public DateTime? LastCheckedAt { get; set; }

    // Navigation properties
    public virtual User CreatedByUser { get; set; } = null!;
}
