using MediatR;
using SoftPMS.Application.Features.Roles.DTOs;

namespace SoftPMS.Application.Features.Roles.Commands.CreateRole;

/// <summary>
/// Represents the Command to create role.
/// </summary>
public record CreateRoleCommand(CreateRoleDto Dto) : IRequest<RoleDto>;


