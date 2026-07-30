using MediatR;
using SoftPMS.Application.Features.Roles.DTOs;

namespace SoftPMS.Application.Features.Roles.Commands.CreateRole;

public record CreateRoleCommand(CreateRoleDto Dto) : IRequest<RoleDto>;
