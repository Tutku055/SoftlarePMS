using MediatR;
using SoftPMS.Application.Features.Users.DTOs;

namespace SoftPMS.Application.Features.Users.Queries.GetUsers;

/// <summary>
/// Represents the Query to get users.
/// </summary>
public record GetUsersQuery : IRequest<IEnumerable<UserDto>>;


