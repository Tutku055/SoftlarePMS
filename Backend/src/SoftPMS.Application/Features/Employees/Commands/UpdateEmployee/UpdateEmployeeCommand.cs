using MediatR;
using SoftPMS.Domain.Enums;

namespace SoftPMS.Application.Features.Employees.Commands.UpdateEmployee;

/// <summary>Command to update a employee's core profile fields (not address or rate — those have dedicated commands).</summary>
public sealed record UpdateEmployeeCommand(
    Guid EmployeeId,
    string FirstName,
    string LastName,
    string Email,
    Gender Gender,
    DateTime DateOfBirth,
    string Nationality,
    Guid? ProfessionId,
    EmploymentStatus EmploymentStatus,
    DateTime? TerminationDate,
    DateTime? ProbationEndDate,
    decimal WorkingHoursPerWeek,
    int AnnualVacationDays,
    int CarriedOverLeaves,
    Guid? DepartmentId
) : IRequest<Unit>;
