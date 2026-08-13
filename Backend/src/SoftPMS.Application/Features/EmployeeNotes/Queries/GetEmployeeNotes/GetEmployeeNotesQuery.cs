using MediatR;
using SoftPMS.Application.Features.EmployeeNotes.DTOs;
using SoftPMS.Domain.Enums;

namespace SoftPMS.Application.Features.EmployeeNotes.Queries.GetEmployeeNotes;

/// <summary>
/// Represents the Query to get employee notes.
/// </summary>
public record GetEmployeeNotesQuery(
    Guid EmployeeId,
    NoteCategory? Category = null,
    bool? IsConfidential = null
) : IRequest<List<EmployeeNoteDto>>;


