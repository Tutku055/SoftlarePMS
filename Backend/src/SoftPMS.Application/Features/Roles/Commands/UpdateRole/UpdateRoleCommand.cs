using MediatR;
using SoftPMS.Application.Features.Roles.DTOs;

namespace SoftPMS.Application.Features.Roles.Commands.UpdateRole;

/// <summary>
/// Represents the Command to update role.
/// </summary>
public record UpdateRoleCommand(Guid Id, UpdateRoleDto Dto) : IRequest<Unit>;


