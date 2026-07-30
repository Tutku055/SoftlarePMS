namespace SoftPMS.Application.Features.Users.DTOs;

/// <summary>Request body for the assign-role endpoint.</summary>
public sealed record AssignRoleRequestDto(Guid RoleId);
