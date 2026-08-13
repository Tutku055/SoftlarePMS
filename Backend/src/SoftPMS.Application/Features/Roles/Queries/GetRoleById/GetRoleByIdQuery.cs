using MediatR;
using SoftPMS.Application.Features.Roles.DTOs;

namespace SoftPMS.Application.Features.Roles.Queries.GetRoleById;

/// <summary>
/// Represents the Query to get role by id.
/// </summary>
public record GetRoleByIdQuery(Guid Id) : IRequest<RoleDto>;



