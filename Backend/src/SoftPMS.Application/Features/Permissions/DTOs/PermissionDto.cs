namespace SoftPMS.Application.Features.Permissions.DTOs;

public record PermissionDto(
    Guid Id,
    string Name,
    string Description
);
