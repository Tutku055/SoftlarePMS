using System;

namespace SoftPMS.Application.Features.Users.DTOs;

public record CreateUserDto(
    Guid? EmployeeId,
    string Username,
    string Email,
    string Password,
    Guid RoleId,
    bool IsActive
);
