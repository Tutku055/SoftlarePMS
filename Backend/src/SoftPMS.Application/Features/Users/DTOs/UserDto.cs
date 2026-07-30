using System;

namespace SoftPMS.Application.Features.Users.DTOs;

public record UserDto
{
    public Guid Id { get; init; }
    public Guid? EmployeeId { get; init; }
    public string Username { get; init; } = string.Empty;
    public string Email { get; init; } = string.Empty;
    public bool IsActive { get; init; }
    public bool IsSystemUser { get; init; }
    public bool RequiresPasswordChange { get; init; }
    public SoftPMS.Application.Features.Roles.DTOs.RoleDto? Role { get; init; }
}
