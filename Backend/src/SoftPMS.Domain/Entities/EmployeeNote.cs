using SoftPMS.Domain.Enums;

namespace SoftPMS.Domain.Entities;

public class EmployeeNote: BaseEntity
{
    public Guid EmployeeId { get; set; }

    public string Title { get; set; } = string.Empty;

    public string Content { get; set; } = string.Empty;

    public NoteCategory Category { get; set; } = NoteCategory.General;

    public bool IsConfidential { get; set; } = false;

    public Guid CreatedByUserId { get; set; }

    // Navigation properties
    public virtual Employee Employee { get; set; } = null!;

    public virtual User CreatedByUser { get; set; } = null!;
}
