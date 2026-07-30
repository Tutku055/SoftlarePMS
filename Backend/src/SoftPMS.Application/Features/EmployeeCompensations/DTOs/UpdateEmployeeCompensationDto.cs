using SoftPMS.Domain.Enums;

namespace SoftPMS.Application.Features.EmployeeCompensations.DTOs;

public record UpdateEmployeeCompensationDto(
    decimal BaseSalary,
    SalaryType SalaryType,
    string PayGrade,
    DateTime EffectiveDate,
    DateTime? EndDate
);
