namespace SoftPMS.Application.Features.Departments.DTOs;

public record DepartmentDto(
    Guid Id,
    string Name,
    string Description,
    int EmployeeCount
);
