using MediatR;

namespace SoftPMS.Application.Features.Roles.Commands.DeleteRole;

/// <summary>
/// Represents the Command to delete role.
/// </summary>
public record DeleteRoleCommand(Guid Id) : IRequest<Unit>;


