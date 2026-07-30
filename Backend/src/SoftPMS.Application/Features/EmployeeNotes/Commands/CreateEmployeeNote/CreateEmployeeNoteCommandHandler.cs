using AutoMapper;
using MediatR;
using SoftPMS.Application.Common.Interfaces;
using SoftPMS.Application.Features.EmployeeNotes.DTOs;
using SoftPMS.Domain.Entities;
using SoftPMS.Domain.Exceptions;

namespace SoftPMS.Application.Features.EmployeeNotes.Commands.CreateEmployeeNote;

public sealed class CreateEmployeeNoteCommandHandler(
    IApplicationDbContext context,
    IMapper mapper,
    ICurrentUserService currentUserService) : IRequestHandler<CreateEmployeeNoteCommand, EmployeeNoteDto>
{
    public async Task<EmployeeNoteDto> Handle(CreateEmployeeNoteCommand request, CancellationToken cancellationToken)
    {
        var employeeExists = await context.Employees.FindAsync(new object[] { request.EmployeeId }, cancellationToken);
        if (employeeExists == null)
            throw new NotFoundException(nameof(Employee), request.EmployeeId);

        if (request.Dto.IsConfidential)
        {
            if (!currentUserService.Permissions.Contains("EmployeeNotes.ManageConfidentiality"))
            {
                throw new ForbiddenAccessException("You do not have permission to create confidential notes.");
            }
        }

        var note = mapper.Map<EmployeeNote>(request.Dto);
        note.EmployeeId = request.EmployeeId;
        
        // As per strictly required by user
        note.CreatedByUserId = currentUserService.UserId;

        context.EmployeeNotes.Add(note);
        await context.SaveChangesAsync(cancellationToken);

        return mapper.Map<EmployeeNoteDto>(note);
    }
}
