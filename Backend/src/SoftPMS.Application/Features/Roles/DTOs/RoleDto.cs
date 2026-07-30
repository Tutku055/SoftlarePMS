namespace SoftPMS.Application.Features.Roles.DTOs;

public record RoleDto
{
    public Guid Id { get; init; }
    public string Name { get; init; } = string.Empty;
    public string Description { get; init; } = string.Empty;
    public string Color { get; init; } = string.Empty;
    public bool IsActive { get; init; }
    public bool IsSystemRole { get; init; }
    public int UserCount { get; init; }
    public List<Guid> PermissionIds { get; init; } = new();
}
