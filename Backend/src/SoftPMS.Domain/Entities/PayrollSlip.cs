namespace SoftPMS.Domain.Entities;

public class PayrollSlip : BaseEntity
{
    public Guid EmployeeId { get; set; }

    public int Year { get; set; }

    public int Month { get; set; }

    public string BaseSalary { get; set; } = string.Empty;

    public string TotalEarnings { get; set; } = string.Empty;

    public string TotalDeductions { get; set; } = string.Empty;

    public string NetSalary { get; set; } = string.Empty;

    public DateTime IssueDate { get; set; }

    // Navigation properties
    public virtual Employee Employee { get; set; } = null!;
}
