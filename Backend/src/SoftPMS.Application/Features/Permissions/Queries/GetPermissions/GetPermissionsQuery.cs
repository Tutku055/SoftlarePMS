using MediatR;
using SoftPMS.Application.Features.Permissions.DTOs;

namespace SoftPMS.Application.Features.Permissions.Queries.GetPermissions;

public record GetPermissionsQuery : IRequest<IEnumerable<PermissionDto>>;
