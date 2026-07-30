using System;
using SoftPMS.Domain.Enums;

namespace SoftPMS.Application.Features.Employees.DTOs;

public record UpdateEmployeeDto(
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
    int AnnualVacationDays,
    int CarriedOverLeaves
);
