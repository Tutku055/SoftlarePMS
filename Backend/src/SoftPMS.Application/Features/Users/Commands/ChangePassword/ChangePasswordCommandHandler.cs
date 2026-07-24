using MediatR;
using Microsoft.EntityFrameworkCore;
using SoftPMS.Application.Common.Interfaces;
using SoftPMS.Domain.Exceptions;

namespace SoftPMS.Application.Features.Users.Commands.ChangePassword;

public sealed class ChangePasswordCommandHandler(
    IApplicationDbContext context,
    ICurrentUserService currentUserService)
    : IRequestHandler<ChangePasswordCommand, Unit>
{
    public async Task<Unit> Handle(ChangePasswordCommand request, CancellationToken cancellationToken)
    {
        var user = await context.Users
            .FirstOrDefaultAsync(u => u.Id == request.UserId, cancellationToken)
            ?? throw new NotFoundException(nameof(Domain.Entities.User), request.UserId);

        bool isChangingOwnPassword = currentUserService.UserId == request.UserId;

        if (!isChangingOwnPassword)
        {
            if (!currentUserService.Permissions.Any(p => string.Equals(p, "Users.ChangePassword", StringComparison.OrdinalIgnoreCase)))
            {
                throw new DomainException("You do not have permission to change other users' passwords.");
            }

            if (user.IsSystemUser)
            {
                throw new DomainException("System Administrator password can only be changed by themselves.");
            }
        }
        else
        {
            if (!BCrypt.Net.BCrypt.Verify(request.OldPassword, user.PasswordHash))
            {
                throw new DomainException("Invalid old password.");
            }
        }

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        user.RequiresPasswordChange = false;

        if (user.IsSystemUser && user.RoleId != Guid.Empty)
        {
            var allPermissionIds = await context.Permissions
                .Select(p => p.Id)
                .ToListAsync(cancellationToken);

            var existingRolePermissions = await context.RolePermissions
                .Where(rp => rp.RoleId == user.RoleId)
                .Select(rp => rp.PermissionId)
                .ToListAsync(cancellationToken);

            var missingPermissionIds = allPermissionIds.Except(existingRolePermissions).ToList();
            
            if (missingPermissionIds.Any())
            {
                context.RolePermissions.AddRange(missingPermissionIds.Select(pid => new Domain.Entities.RolePermission
                {
                    RoleId = user.RoleId,
                    PermissionId = pid
                }));
            }
        }

        await context.SaveChangesAsync(cancellationToken);
        
        return Unit.Value;
    }
}
