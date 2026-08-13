using MediatR;

namespace SoftPMS.Application.Features.Users.Commands.DeleteUser;

/// <summary>
/// Represents the Command to delete user.
/// </summary>
public record DeleteUserCommand(Guid Id) : IRequest<Unit>;


