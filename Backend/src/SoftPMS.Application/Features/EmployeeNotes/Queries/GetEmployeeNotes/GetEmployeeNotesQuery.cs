using MediatR;
using SoftPMS.Application.Features.EmployeeNotes.DTOs;
using SoftPMS.Domain.Enums;

namespace SoftPMS.Application.Features.EmployeeNotes.Queries.GetEmployeeNotes;

public record GetEmployeeNotesQuery(
    Guid EmployeeId,
    NoteCategory? Category = null,
    bool? IsConfidential = null
) : IRequest<List<EmployeeNoteDto>>;
