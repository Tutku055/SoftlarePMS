using System;
using System.Collections.Generic;
using System.Reflection;
using System.Text;
using SoftPMS.Application.Features.Departments.DTOs;
using SoftPMS.Domain.Enums;

namespace SoftPMS.Application.Features.Employees.DTOs;

public record EmployeeDto(
    Guid Id,
    string EmployeeNo,
    string FirstName,
    string LastName,
    Gender Gender,
    EmploymentStatus EmploymentStatus,
    string Profession,
    DateTime HireDate,
    DateTime? TerminationDate,
    DateTime? ProbationEndDate,
    decimal WorkingHoursPerWeek,
    int AnnualVacationDays,
    int CarriedOverLeaves,
    DepartmentDto? Department
);
