using MediatR;
using SoftPMS.Application.Features.Users.DTOs;

namespace SoftPMS.Application.Features.Users.Queries.GetUserById;

/// <summary>
/// Represents the Query to get user by id.
/// </summary>
public record GetUserByIdQuery(Guid Id) : IRequest<UserDto>;



