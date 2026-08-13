using MediatR;
using SoftPMS.Application.Features.Permissions.DTOs;

namespace SoftPMS.Application.Features.Permissions.Queries.GetPermissions;

/// <summary>
/// Represents the Query to get permissions.
/// </summary>
public record GetPermissionsQuery : IRequest<IEnumerable<PermissionDto>>;


