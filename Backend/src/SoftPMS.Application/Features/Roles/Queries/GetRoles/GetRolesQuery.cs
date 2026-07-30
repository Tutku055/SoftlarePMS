using MediatR;
using SoftPMS.Application.Features.Roles.DTOs;

namespace SoftPMS.Application.Features.Roles.Queries.GetRoles;

public record GetRolesQuery : IRequest<IEnumerable<RoleDto>>;
