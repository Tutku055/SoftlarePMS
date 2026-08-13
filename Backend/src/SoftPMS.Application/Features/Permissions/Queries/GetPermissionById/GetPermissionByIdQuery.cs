using MediatR;
using SoftPMS.Application.Features.Permissions.DTOs;

namespace SoftPMS.Application.Features.Permissions.Queries.GetPermissionById;

/// <summary>
/// Represents the Query to get permission by id.
/// </summary>
public record GetPermissionByIdQuery(Guid Id) : IRequest<PermissionDto>;



