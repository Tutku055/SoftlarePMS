using AutoMapper;
using MediatR;
using SoftPMS.Application.Common.Interfaces;
using SoftPMS.Application.Features.Departments.DTOs;
using SoftPMS.Domain.Entities;

namespace SoftPMS.Application.Features.Departments.Commands.CreateDepartment;

public sealed class CreateDepartmentCommandHandler(
    IApplicationDbContext context,
    IMapper mapper,
    IDateTime dateTime)
    : IRequestHandler<CreateDepartmentCommand, DepartmentDto>
{
    public async Task<DepartmentDto> Handle(CreateDepartmentCommand request, CancellationToken cancellationToken)
    {
        var department = new Department
        {
            Name = request.Name,
            Description = request.Description,
            CreatedAt = dateTime.UtcNow
        };

        await context.Departments.AddAsync(department, cancellationToken);
        await context.SaveChangesAsync(cancellationToken);

        return mapper.Map<DepartmentDto>(department);
    }
}
