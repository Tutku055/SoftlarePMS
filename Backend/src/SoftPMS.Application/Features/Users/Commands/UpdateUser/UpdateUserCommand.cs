using MediatR;
using SoftPMS.Application.Features.Users.DTOs;

namespace SoftPMS.Application.Features.Users.Commands.UpdateUser;

/// <summary>
/// Represents the Command to update user.
/// </summary>
public record UpdateUserCommand(Guid Id, UpdateUserDto Dto) : IRequest<Unit>;


