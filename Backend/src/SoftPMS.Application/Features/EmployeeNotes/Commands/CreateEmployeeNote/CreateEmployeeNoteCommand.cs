using MediatR;
using SoftPMS.Application.Features.EmployeeNotes.DTOs;

namespace SoftPMS.Application.Features.EmployeeNotes.Commands.CreateEmployeeNote;

/// <summary>
/// Represents the Command to create employee note.
/// </summary>
public record CreateEmployeeNoteCommand(
    Guid EmployeeId,
    CreateEmployeeNoteDto Dto
) : IRequest<EmployeeNoteDto>;


