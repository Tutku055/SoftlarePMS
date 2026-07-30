namespace SoftPMS.Application.Features.Professions.DTOs;

public sealed record ProfessionDto(
    Guid Id,
    string Name,
    string Description,
    bool IsActive,
    int EmployeeCount,
    DateTime CreatedAt
);
