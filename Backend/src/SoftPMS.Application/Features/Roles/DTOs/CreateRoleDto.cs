namespace SoftPMS.Application.Features.Roles.DTOs;

public record CreateRoleDto(
    string Name,
    string Description,
    string Color,
    List<Guid>? PermissionIds = null
);
