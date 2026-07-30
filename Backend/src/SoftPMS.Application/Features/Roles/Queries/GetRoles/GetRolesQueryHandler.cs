using AutoMapper;
using AutoMapper.QueryableExtensions;
using MediatR;
using Microsoft.EntityFrameworkCore;
using SoftPMS.Application.Common.Interfaces;
using SoftPMS.Application.Features.Roles.DTOs;

namespace SoftPMS.Application.Features.Roles.Queries.GetRoles;

public sealed class GetRolesQueryHandler(
    IApplicationDbContext context,
    IMapper mapper)
    : IRequestHandler<GetRolesQuery, IEnumerable<RoleDto>>
{
    public async Task<IEnumerable<RoleDto>> Handle(GetRolesQuery request, CancellationToken cancellationToken)
    {
        return await context.Roles
            .AsNoTracking()
            .Where(r => r.Name != "SuperAdmin")
            .ProjectTo<RoleDto>(mapper.ConfigurationProvider)
            .ToListAsync(cancellationToken);
    }
}
