using System;

namespace SoftPMS.Application.Features.Users.DTOs;

public record UpdateUserDto(
    Guid? EmployeeId,
    string Username,
    string Email,
    bool IsActive
);
