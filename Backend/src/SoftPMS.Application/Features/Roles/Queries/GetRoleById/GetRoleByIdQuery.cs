using MediatR;
using SoftPMS.Application.Features.Roles.DTOs;

namespace SoftPMS.Application.Features.Roles.Queries.GetRoleById;

public record GetRoleByIdQuery(Guid Id) : IRequest<RoleDto>;
