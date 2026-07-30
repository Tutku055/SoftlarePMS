using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using SoftPMS.Application.Common.Interfaces;
using SoftPMS.Application.Features.Permissions.DTOs;
using SoftPMS.Domain.Entities;

namespace SoftPMS.Application.Features.Permissions.Commands.CreatePermission;

public sealed class CreatePermissionCommandHandler(
    IApplicationDbContext context,
    IMapper mapper)
    : IRequestHandler<CreatePermissionCommand, PermissionDto>
{
    public async Task<PermissionDto> Handle(CreatePermissionCommand request, CancellationToken cancellationToken)
    {
        var exists = await context.Permissions.AnyAsync(p => p.Name == request.Dto.Name, cancellationToken);
        if (exists)
            throw new Domain.Exceptions.DomainException($"Permission '{request.Dto.Name}' already exists.");

        var permission = new Permission
        {
            Id = Guid.NewGuid(),
            Name = request.Dto.Name,
            Description = request.Dto.Description
        };

        await context.Permissions.AddAsync(permission, cancellationToken);
        await context.SaveChangesAsync(cancellationToken);

        return mapper.Map<PermissionDto>(permission);
    }
}
