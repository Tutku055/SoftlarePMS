using SoftPMS.Domain.Enums;

namespace SoftPMS.Application.Features.EmployeeCompensations.DTOs;

public record CreateEmployeeCompensationDto(
    decimal BaseSalary,
    SalaryType SalaryType,
    string PayGrade,
    DateTime EffectiveDate
);
