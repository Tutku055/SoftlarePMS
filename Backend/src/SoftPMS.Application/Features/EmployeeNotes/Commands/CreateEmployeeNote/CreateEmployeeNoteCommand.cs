using MediatR;
using SoftPMS.Application.Features.EmployeeNotes.DTOs;

namespace SoftPMS.Application.Features.EmployeeNotes.Commands.CreateEmployeeNote;

public record CreateEmployeeNoteCommand(
    Guid EmployeeId,
    CreateEmployeeNoteDto Dto
) : IRequest<EmployeeNoteDto>;
