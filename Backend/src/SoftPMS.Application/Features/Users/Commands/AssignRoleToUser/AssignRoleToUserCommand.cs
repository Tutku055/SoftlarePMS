using System;
using MediatR;

namespace SoftPMS.Application.Features.Users.Commands.AssignRoleToUser;

/// <summary>
/// Represents the Command to assign role to user.
/// </summary>
public sealed record AssignRoleToUserCommand(Guid UserId, Guid RoleId) : IRequest<Unit>;


