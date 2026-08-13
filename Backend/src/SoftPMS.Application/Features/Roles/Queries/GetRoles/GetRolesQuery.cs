using MediatR;
using SoftPMS.Application.Features.Roles.DTOs;

namespace SoftPMS.Application.Features.Roles.Queries.GetRoles;

/// <summary>
/// Represents the Query to get roles.
/// </summary>
public record GetRolesQuery : IRequest<IEnumerable<RoleDto>>;


