using AutoMapper;
using MediatR;
using SoftPMS.Application.Common.Interfaces;
using SoftPMS.Application.Features.EmployeeReferences.DTOs;
using SoftPMS.Domain.Entities;
using SoftPMS.Domain.Exceptions;

namespace SoftPMS.Application.Features.EmployeeReferences.Commands.CreateEmployeeReference;

public sealed class CreateEmployeeReferenceCommandHandler(
    IApplicationDbContext context,
    IMapper mapper) : IRequestHandler<CreateEmployeeReferenceCommand, EmployeeReferenceDto>
{
    public async Task<EmployeeReferenceDto> Handle(CreateEmployeeReferenceCommand request, CancellationToken cancellationToken)
    {
        var employeeExists = await context.Employees.FindAsync(new object[] { request.EmployeeId }, cancellationToken);
        if (employeeExists == null)
            throw new NotFoundException(nameof(Employee), request.EmployeeId);

        var reference = mapper.Map<EmployeeReference>(request.Dto);
        reference.EmployeeId = request.EmployeeId;
        
        context.EmployeeReferences.Add(reference);
        await context.SaveChangesAsync(cancellationToken);

        return mapper.Map<EmployeeReferenceDto>(reference);
    }
}
