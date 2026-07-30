using MediatR;
using SoftPMS.Application.Features.Roles.DTOs;

namespace SoftPMS.Application.Features.Roles.Commands.UpdateRole;

public record UpdateRoleCommand(Guid Id, UpdateRoleDto Dto) : IRequest<Unit>;
