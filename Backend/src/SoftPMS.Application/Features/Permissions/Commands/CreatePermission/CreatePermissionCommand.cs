using MediatR;
using SoftPMS.Application.Features.Permissions.DTOs;

namespace SoftPMS.Application.Features.Permissions.Commands.CreatePermission;

public record CreatePermissionCommand(CreatePermissionDto Dto) : IRequest<PermissionDto>;
