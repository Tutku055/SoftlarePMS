using MediatR;
using SoftPMS.Application.Features.Permissions.DTOs;

namespace SoftPMS.Application.Features.Permissions.Commands.CreatePermission;

/// <summary>
/// Represents the Command to create permission.
/// </summary>
public record CreatePermissionCommand(CreatePermissionDto Dto) : IRequest<PermissionDto>;


