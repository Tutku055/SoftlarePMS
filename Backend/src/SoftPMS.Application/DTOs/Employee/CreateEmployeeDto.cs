using SoftPMS.Domain.Enums;

namespace SoftPMS.Application.DTOs.Employee;

public record CreateEmployeeDto(
    string EmployeeNo,
    string FirstName,
    string LastName,
    Gender Gender,
    DateTime DateOfBirth,
    string Nationality,
    string Profession,
    EmploymentStatus EmploymentStatus,
    DateTime HireDate,
    decimal WorkingHoursPerWeek,
    int VacationDaysTotal,
    Guid? DepartmentId,

    // Initial primary address (saved as separate EmployeeAddress entity)
    string AddressLine,
    string PostalCode,
    string City,
    string State,
    string Country
);