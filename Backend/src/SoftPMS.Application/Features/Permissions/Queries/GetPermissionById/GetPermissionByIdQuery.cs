using MediatR;
using SoftPMS.Application.Features.Permissions.DTOs;

namespace SoftPMS.Application.Features.Permissions.Queries.GetPermissionById;

public record GetPermissionByIdQuery(Guid Id) : IRequest<PermissionDto>;
