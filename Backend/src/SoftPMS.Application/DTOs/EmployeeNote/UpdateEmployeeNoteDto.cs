using SoftPMS.Domain.Enums;

namespace SoftPMS.Application.DTOs.EmployeeNote;

public record UpdateEmployeeNoteDto(
    string Title,
    string Content,
    NoteCategory Category,
    bool IsConfidential
);
