namespace SoftPMS.Application.Features.Roles.DTOs;

/// <summary>Request body for the assign-permissions endpoint.</summary>
public sealed record AssignPermissionsRequestDto(List<Guid> PermissionIds);
