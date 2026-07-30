using SoftPMS.Domain.Enums;
using SoftPMS.Application.Features.Employees.DTOs;
using SoftPMS.Application.Features.Departments.DTOs;
using SoftPMS.Application.Features.EmployeeCompensations.DTOs;
using SoftPMS.Application.Features.EmployeeNotes.DTOs;
using SoftPMS.Application.Features.EmployeeReferences.DTOs;

namespace SoftPMS.Application.Features.Employees.DTOs;

public record EmployeeDetailDto
{
    public Guid Id { get; init; }
    public string EmployeeNo { get; init; }
    public string FirstName { get; init; }
    public string LastName { get; init; }
    public Gender Gender { get; init; }
    public DateTime DateOfBirth { get; init; }
    public string Nationality { get; init; }
    public Guid? ProfessionId { get; init; }
    public string? ProfessionName { get; init; }
    public EmploymentStatus EmploymentStatus { get; init; }
    public DateTime HireDate { get; init; }
    public DateTime? TerminationDate { get; init; }
    public DateTime? ProbationEndDate { get; init; }
    public decimal WorkingHoursPerWeek { get; init; }
    public int AnnualVacationDays { get; init; }
    public int CarriedOverLeaves { get; init; }
    public decimal UsedLeaveDaysThisYear { get; set; }

    public DepartmentDto? Department { get; init; }

    public List<EmployeeAddressDto> Addresses { get; init; } = new();
    public EmployeeCompensationDto? Compensation { get; init; }
    public List<EmployeeCompensationDto> Compensations { get; init; } = new();

    public List<EmployeeNoteDto> Notes { get; init; } = new();
    public List<EmployeeReferenceDto> References { get; init; } = new();
}
