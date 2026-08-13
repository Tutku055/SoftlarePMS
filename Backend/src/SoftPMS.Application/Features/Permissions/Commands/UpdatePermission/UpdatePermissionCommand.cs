using MediatR;
using SoftPMS.Application.Features.Permissions.DTOs;

namespace SoftPMS.Application.Features.Permissions.Commands.UpdatePermission;

/// <summary>
/// Represents the Command to update permission.
/// </summary>
public record UpdatePermissionCommand(Guid Id, UpdatePermissionDto Dto) : IRequest<Unit>;


