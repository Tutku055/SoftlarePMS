using MediatR;
using SoftPMS.Application.Features.Users.DTOs;

namespace SoftPMS.Application.Features.Users.Queries.GetUsers;

public record GetUsersQuery : IRequest<IEnumerable<UserDto>>;
