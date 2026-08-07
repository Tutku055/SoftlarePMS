using SoftPMS.Domain.Enums;

namespace SoftPMS.Application.Features.Calendar.DTOs;

public class CalendarNoteDto
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string? AuthorName { get; set; }
    public DateOnly NoteDate { get; set; }
    public string Content { get; set; } = string.Empty;
    public string ColorCode { get; set; } = "#3B82F6";
    public VisibilityLevel VisibilityLevel { get; set; } = VisibilityLevel.Standard;
    public DateTime CreatedAt { get; set; }
}
