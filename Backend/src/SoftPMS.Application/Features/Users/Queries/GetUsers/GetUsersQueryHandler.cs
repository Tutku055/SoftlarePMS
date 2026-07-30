using AutoMapper;
using AutoMapper.QueryableExtensions;
using MediatR;
using Microsoft.EntityFrameworkCore;
using SoftPMS.Application.Common.Interfaces;
using SoftPMS.Application.Features.Users.DTOs;

namespace SoftPMS.Application.Features.Users.Queries.GetUsers;

public sealed class GetUsersQueryHandler(
    IApplicationDbContext context,
    IMapper mapper)
    : IRequestHandler<GetUsersQuery, IEnumerable<UserDto>>
{
    public async Task<IEnumerable<UserDto>> Handle(GetUsersQuery request, CancellationToken cancellationToken)
    {
        var users = await context.Users
            .Include(u => u.Role)
            .Include(u => u.Employee)
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        return mapper.Map<IEnumerable<UserDto>>(users);
    }
}
