using MediatR;

namespace SoftPMS.Application.Features.Permissions.Commands.DeletePermission;

/// <summary>
/// Represents the Command to delete permission.
/// </summary>
public record DeletePermissionCommand(Guid Id) : IRequest<Unit>;


