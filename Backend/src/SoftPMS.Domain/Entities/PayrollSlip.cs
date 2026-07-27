namespace SoftPMS.Domain.Entities;

public class PayrollSlip : BaseEntity
{
    public Guid EmployeeId { get; set; }

    public int Year { get; set; }

    public int Month { get; set; }

    public decimal BaseSalary { get; set; }

    public decimal TotalEarnings { get; set; }

    public decimal TotalDeductions { get; set; }

    public decimal NetSalary { get; set; }

    public DateTime IssueDate { get; set; }

    // Navigation properties
    public virtual Employee Employee { get; set; } = null!;
}
