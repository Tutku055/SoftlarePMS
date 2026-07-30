using SoftPMS.Domain.Enums;

namespace SoftPMS.Application.Features.EmployeeNotes.DTOs;

public record CreateEmployeeNoteDto(
    string Title,
    string Content,
    NoteCategory Category,
    bool IsConfidential
);
