using MediatR;
using SoftPMS.Application.Features.Permissions.DTOs;

namespace SoftPMS.Application.Features.Permissions.Commands.UpdatePermission;

public record UpdatePermissionCommand(Guid Id, UpdatePermissionDto Dto) : IRequest<Unit>;
