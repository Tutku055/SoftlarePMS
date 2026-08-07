using SoftPMS.Domain.Enums;

namespace SoftPMS.Domain.Entities;

public class CalendarNote : BaseEntity
{
    public Guid UserId { get; set; }

    public DateOnly NoteDate { get; set; }

    public string Content { get; set; } = string.Empty;

    public string ColorCode { get; set; } = "#3B82F6";

    public VisibilityLevel VisibilityLevel { get; set; } = VisibilityLevel.Standard;

    // Navigation property
    public virtual User? User { get; set; }
}
