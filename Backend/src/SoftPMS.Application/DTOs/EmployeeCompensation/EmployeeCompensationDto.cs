using SoftPMS.Domain.Enums;

namespace SoftPMS.Application.DTOs.EmployeeCompensation;

public record EmployeeCompensationDto
{
    public Guid Id { get; init; }
    public decimal BaseSalary { get; init; }
    public SalaryType SalaryType { get; init; }
    public string PayGrade { get; init; }
    public DateTime EffectiveDate { get; init; }
    public Currency Currency { get; init; }
    public bool IsActive { get; init; }
}