using AutoMapper;
using AutoMapper.QueryableExtensions;
using MediatR;
using Microsoft.EntityFrameworkCore;
using SoftPMS.Application.Common.Interfaces;
using SoftPMS.Application.Features.Permissions.DTOs;

namespace SoftPMS.Application.Features.Permissions.Queries.GetPermissions;

public sealed class GetPermissionsQueryHandler(
    IApplicationDbContext context,
    IMapper mapper,
    ICurrentUserService currentUserService)
    : IRequestHandler<GetPermissionsQuery, IEnumerable<PermissionDto>>
{
    public async Task<IEnumerable<PermissionDto>> Handle(GetPermissionsQuery request, CancellationToken cancellationToken)
    {
        var userRoleId = await context.Users
            .Where(u => u.Id == currentUserService.UserId)
            .Select(u => u.RoleId)
            .FirstOrDefaultAsync(cancellationToken);

        return await context.RolePermissions
            .Where(rp => rp.RoleId == userRoleId)
            .Select(rp => rp.Permission)
            .AsNoTracking()
            .ProjectTo<PermissionDto>(mapper.ConfigurationProvider)
            .ToListAsync(cancellationToken);
    }
}
