using MediatR;
using SoftPMS.Domain.Enums;

namespace SoftPMS.Application.Features.Employees.Commands.CreateEmployee;

/// <summary>
/// Creates a new employee with an initial address. Compensation is managed separately via UpdateEmployeeCompensation.
/// </summary>
public sealed record CreateEmployeeCommand(
    string FirstName,
    string LastName,
    string Email,
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
    // Initial address (required at creation)
    string AddressLine,
    string PostalCode,
    string City,
    string State,
    string Country,
    Guid? DepartmentId
) : IRequest<CreatedEmployeeDto>;
