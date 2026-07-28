using SoftPMS.Domain.Enums;
using SoftPMS.Application.DTOs.EmployeeAddress;
using SoftPMS.Application.DTOs.Department;
using SoftPMS.Application.DTOs.EmployeeCompensation;
using SoftPMS.Application.DTOs.EmployeeNote;
using SoftPMS.Application.DTOs.EmployeeReference;

namespace SoftPMS.Application.DTOs.Employee;

public record EmployeeDetailDto
{
    public Guid Id { get; init; }
    public string EmployeeNo { get; init; }
    public string FirstName { get; init; }
    public string LastName { get; init; }
    public Gender Gender { get; init; }
    public DateTime DateOfBirth { get; init; }
    public string Nationality { get; init; }
    public string Profession { get; init; }
    public EmploymentStatus EmploymentStatus { get; init; }
    public DateTime HireDate { get; init; }
    public DateTime? TerminationDate { get; init; }
    public DateTime? ProbationEndDate { get; init; }
    public decimal WorkingHoursPerWeek { get; init; }
    public int VacationDaysTotal { get; init; }

    public DepartmentDto? Department { get; init; }

    public List<EmployeeAddressDto> Addresses { get; init; } = new();
    public EmployeeCompensationDto? Compensation { get; init; }
    public List<EmployeeCompensationDto> Compensations { get; init; } = new();

    public List<EmployeeNoteDto> Notes { get; init; } = new();
    public List<EmployeeReferenceDto> References { get; init; } = new();
}