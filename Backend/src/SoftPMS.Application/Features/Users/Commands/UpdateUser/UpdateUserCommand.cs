using MediatR;
using SoftPMS.Application.Features.Users.DTOs;

namespace SoftPMS.Application.Features.Users.Commands.UpdateUser;

public record UpdateUserCommand(Guid Id, UpdateUserDto Dto) : IRequest<Unit>;
