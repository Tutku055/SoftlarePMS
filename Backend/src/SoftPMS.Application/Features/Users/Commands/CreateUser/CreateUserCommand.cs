using MediatR;
using SoftPMS.Application.Features.Users.DTOs;

namespace SoftPMS.Application.Features.Users.Commands.CreateUser;

/// <summary>
/// Represents the Command to create user.
/// </summary>
public record CreateUserCommand(CreateUserDto Dto) : IRequest<UserDto>;


