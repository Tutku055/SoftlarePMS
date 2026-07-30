using SoftPMS.Domain.Enums;

namespace SoftPMS.Application.Features.Employees.DTOs;

public record CreateEmployeeDto(
    string EmployeeNo,
    string FirstName,
    string LastName,
    Gender Gender,
    DateTime DateOfBirth,
    string Nationality,
    Guid? ProfessionId,
    EmploymentStatus EmploymentStatus,
    DateTime HireDate,
    decimal WorkingHoursPerWeek,
    int AnnualVacationDays,
    int CarriedOverLeaves,
    SalaryType SalaryType,
    Guid? DepartmentId,

    // Initial primary address (saved as separate EmployeeAddress entity)
    string AddressLine,
    string PostalCode,
    string City,
    string State,
    string Country
);
