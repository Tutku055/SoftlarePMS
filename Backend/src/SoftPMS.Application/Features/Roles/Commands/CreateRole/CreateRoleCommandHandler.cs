using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using SoftPMS.Application.Common.Interfaces;
using SoftPMS.Application.Features.Roles.DTOs;
using SoftPMS.Domain.Entities;

namespace SoftPMS.Application.Features.Roles.Commands.CreateRole;

public sealed class CreateRoleCommandHandler(
    IApplicationDbContext context,
    IMapper mapper,
    ICurrentUserService currentUserService)
    : IRequestHandler<CreateRoleCommand, RoleDto>
{
    public async Task<RoleDto> Handle(CreateRoleCommand request, CancellationToken cancellationToken)
    {
        var exists = await context.Roles.AnyAsync(r => r.Name == request.Dto.Name, cancellationToken);
        if (exists)
            throw new Domain.Exceptions.DomainException($"Role '{request.Dto.Name}' already exists.");

        var permissionIds = request.Dto.PermissionIds?.Distinct().ToList() ?? new List<Guid>();

        if (permissionIds.Count > 0)
        {
            var userRoleId = await context.Users
                .Where(u => u.Id == currentUserService.UserId)
                .Select(u => u.RoleId)
                .FirstOrDefaultAsync(cancellationToken);

            var userPermissionNames = await context.RolePermissions
                .Where(rp => rp.RoleId == userRoleId)
                .Select(rp => rp.Permission.Name)
                .ToListAsync(cancellationToken);

            var userPermissions = userPermissionNames.ToHashSet(StringComparer.OrdinalIgnoreCase);

            var requestedPermissions = await context.Permissions
                .Where(p => permissionIds.Contains(p.Id))
                .ToListAsync(cancellationToken);

            if (requestedPermissions.Count != permissionIds.Count)
                throw new Domain.Exceptions.NotFoundException(nameof(Permission), "one or more requested permission IDs");

            var unauthorizedPermissions = requestedPermissions.Where(p => !userPermissions.Contains(p.Name)).ToList();

            if (unauthorizedPermissions.Any())
            {
                var unauthorizedNames = string.Join(", ", unauthorizedPermissions.Select(p => p.Name));
                throw new Domain.Exceptions.UnauthorizedException($"Privilege Escalation Detected: You can only assign permissions that you currently possess. You are missing: {unauthorizedNames}");
            }
        }

        var role = new Role
        {
            Id = Guid.NewGuid(),
            Name = request.Dto.Name,
            Description = request.Dto.Description,
            Color = request.Dto.Color,
            IsActive = true,
            IsSystemRole = false
        };

        if (permissionIds.Count > 0)
        {
            role.RolePermissions = permissionIds.Select(pid => new RolePermission
            {
                RoleId = role.Id,
                PermissionId = pid
            }).ToList();
        }

        await context.Roles.AddAsync(role, cancellationToken);
        await context.SaveChangesAsync(cancellationToken);

        return mapper.Map<RoleDto>(role);
    }
}
