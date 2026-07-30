using SoftPMS.Domain.Enums;

namespace SoftPMS.Application.Features.EmployeeNotes.DTOs;

public record EmployeeNoteDto
{
    public Guid Id { get; init; }
    public string Title { get; init; } = string.Empty;
    public string Content { get; init; } = string.Empty;
    public NoteCategory Category { get; init; }
    public bool IsConfidential { get; init; }
    public DateTime CreatedAt { get; init; }
}
