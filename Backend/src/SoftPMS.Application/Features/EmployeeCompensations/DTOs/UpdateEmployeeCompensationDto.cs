using SoftPMS.Domain.Enums;

namespace SoftPMS.Application.Features.EmployeeCompensations.DTOs;

public record UpdateEmployeeCompensationDto(
    decimal BaseSalary,
    SalaryType SalaryType,
    DateTime EffectiveDate,
    DateTime? EndDate
);
