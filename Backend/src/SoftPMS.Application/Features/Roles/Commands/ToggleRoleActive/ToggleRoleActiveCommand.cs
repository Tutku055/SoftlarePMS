using MediatR;

namespace SoftPMS.Application.Features.Roles.Commands.ToggleRoleActive;

/// <summary>
/// Represents the Command to toggle role active.
/// </summary>
public record ToggleRoleActiveCommand(Guid Id) : IRequest<Unit>;


