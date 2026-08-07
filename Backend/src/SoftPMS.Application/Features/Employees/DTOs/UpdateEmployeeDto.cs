using System;
using SoftPMS.Domain.Enums;

namespace SoftPMS.Application.Features.Employees.DTOs;

public record UpdateEmployeeDto(
    string EmployeeNo,
    string FirstName,
    string LastName,
    string Email,
    Gender Gender,
    DateTime DateOfBirth,
    string Nationality,
    Guid? ProfessionId,
    EmploymentStatus EmploymentStatus,
    decimal WorkingHoursPerWeek,
    int AnnualVacationDays,
    int CarriedOverLeaves
);
