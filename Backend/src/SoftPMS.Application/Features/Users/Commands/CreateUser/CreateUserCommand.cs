using MediatR;
using SoftPMS.Application.Features.Users.DTOs;

namespace SoftPMS.Application.Features.Users.Commands.CreateUser;

public record CreateUserCommand(CreateUserDto Dto) : IRequest<UserDto>;
