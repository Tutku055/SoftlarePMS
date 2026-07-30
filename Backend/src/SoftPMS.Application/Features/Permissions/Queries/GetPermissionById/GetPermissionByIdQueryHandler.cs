using AutoMapper;
using AutoMapper.QueryableExtensions;
using MediatR;
using Microsoft.EntityFrameworkCore;
using SoftPMS.Application.Common.Interfaces;
using SoftPMS.Application.Features.Permissions.DTOs;
using SoftPMS.Domain.Exceptions;

namespace SoftPMS.Application.Features.Permissions.Queries.GetPermissionById;

public sealed class GetPermissionByIdQueryHandler(
    IApplicationDbContext context,
    IMapper mapper)
    : IRequestHandler<GetPermissionByIdQuery, PermissionDto>
{
    public async Task<PermissionDto> Handle(GetPermissionByIdQuery request, CancellationToken cancellationToken)
    {
        return await context.Permissions
            .AsNoTracking()
            .ProjectTo<PermissionDto>(mapper.ConfigurationProvider)
            .FirstOrDefaultAsync(p => p.Id == request.Id, cancellationToken)
            ?? throw new NotFoundException(nameof(Domain.Entities.Permission), request.Id);
    }
}
