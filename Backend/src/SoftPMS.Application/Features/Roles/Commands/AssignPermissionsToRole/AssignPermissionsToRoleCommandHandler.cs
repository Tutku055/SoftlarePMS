using MediatR;
using Microsoft.EntityFrameworkCore;
using SoftPMS.Application.Common.Interfaces;
using SoftPMS.Domain.Entities;
using SoftPMS.Domain.Exceptions;

namespace SoftPMS.Application.Features.Roles.Commands.AssignPermissionsToRole;

public sealed class AssignPermissionsToRoleCommandHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    : IRequestHandler<AssignPermissionsToRoleCommand, Unit>
{
    public async Task<Unit> Handle(AssignPermissionsToRoleCommand request, CancellationToken cancellationToken)
    {
        // Normalise: treat a null list as an empty list (removes all permissions)
        var permissionIds = request.PermissionIds ?? [];

        var role = await context.Roles
            .Include(r => r.RolePermissions)
            .FirstOrDefaultAsync(r => r.Id == request.RoleId, cancellationToken)
            ?? throw new NotFoundException(nameof(Role), request.RoleId);

        // Validate all requested permissions exist
        var distinctPermissionIds = permissionIds.Distinct().ToList();

        if (distinctPermissionIds.Count > 0)
        {
            var validCount = await context.Permissions.CountAsync(p => distinctPermissionIds.Contains(p.Id), cancellationToken);
            if (validCount != distinctPermissionIds.Count)
                throw new NotFoundException(nameof(Permission), "one or more requested permission IDs");
        }

        var existingPermissionIds = role.RolePermissions.Select(rp => rp.PermissionId).ToList();

        var toAdd = distinctPermissionIds.Except(existingPermissionIds).ToList();
        var toDelete = existingPermissionIds.Except(distinctPermissionIds).ToList();
        var changedPermissionIds = toAdd.Concat(toDelete).ToList();

        // If no changes were made, short-circuit immediately without touching the database
        if (changedPermissionIds.Count == 0)
        {
            return Unit.Value;
        }

        var userRoleId = await context.Users
            .Where(u => u.Id == currentUserService.UserId)
            .Select(u => u.RoleId)
            .FirstOrDefaultAsync(cancellationToken);

        var userPermissionNames = await context.RolePermissions
            .Where(rp => rp.RoleId == userRoleId)
            .Select(rp => rp.Permission.Name)
            .ToListAsync(cancellationToken);

        var userPermissions = userPermissionNames.ToHashSet(StringComparer.OrdinalIgnoreCase);

        var changedPermissions = await context.Permissions
            .Where(p => changedPermissionIds.Contains(p.Id))
            .ToListAsync(cancellationToken);

        var unauthorizedPermissions = changedPermissions.Where(p => !userPermissions.Contains(p.Name)).ToList();

        if (unauthorizedPermissions.Any())
        {
            var unauthorizedNames = string.Join(", ", unauthorizedPermissions.Select(p => p.Name));
            throw new UnauthorizedException($"Privilege Escalation Detected: You can only assign or revoke permissions that you currently possess. You are missing: {unauthorizedNames}");
        }

        // Delta-based mutation: only delete removed links and add newly requested links
        if (toDelete.Count > 0)
        {
            var entitiesToDelete = role.RolePermissions
                .Where(rp => toDelete.Contains(rp.PermissionId))
                .ToList();

            context.RolePermissions.RemoveRange(entitiesToDelete);
        }

        if (toAdd.Count > 0)
        {
            var entitiesToAdd = toAdd
                .Select(pid => new RolePermission { RoleId = role.Id, PermissionId = pid })
                .ToList();

            await context.RolePermissions.AddRangeAsync(entitiesToAdd, cancellationToken);
        }

        await context.SaveChangesAsync(cancellationToken);

        return Unit.Value;
    }
}
