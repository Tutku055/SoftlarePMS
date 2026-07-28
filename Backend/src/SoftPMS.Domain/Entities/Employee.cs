using SoftPMS.Domain.Enums;

namespace SoftPMS.Domain.Entities;

public class Employee: BaseEntity
{
    public string EmployeeNo { get; set; } = string.Empty;

    public string FirstName { get; set; } = string.Empty;

    public string LastName { get; set; } = string.Empty;

    public Gender Gender { get; set; } = Gender.Unspecified;

    public DateTime DateOfBirth { get; set; }

    public string Nationality { get; set; } = string.Empty;

    public string Profession { get; set; } = string.Empty;

    public EmploymentStatus EmploymentStatus { get; set; } = EmploymentStatus.Active;

    public DateTime HireDate { get; set; }

    public DateTime? TerminationDate { get; set; }

    public DateTime? ProbationEndDate { get; set; }

    public decimal WorkingHoursPerWeek { get; set; }

    public int VacationDaysTotal { get; set; }

    public bool IsDeleted { get; set; } = false;

    public Guid CreatedByUserId { get; set; }

    public Guid? DepartmentId { get; set; }

    // Navigation properties
    public virtual User CreatedByUser { get; set; } = null!;

    public virtual User? LinkedUser { get; set; }

    public virtual ICollection<EmployeeAddress> Addresses { get; set; } = new HashSet<EmployeeAddress>();

    public virtual ICollection<EmployeeCompensation> Compensations { get; set; } = new HashSet<EmployeeCompensation>();

    public virtual ICollection<EmployeeNote> Notes { get; set; } = new HashSet<EmployeeNote>();

    public virtual ICollection<EmployeeReference> References { get; set; } = new HashSet<EmployeeReference>();

    public virtual Department? Department { get; set; }
}
