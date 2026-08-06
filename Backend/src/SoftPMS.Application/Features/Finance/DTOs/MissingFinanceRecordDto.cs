namespace SoftPMS.Application.Features.Finance.DTOs;

public class MissingFinanceRecordDto
{
    public Guid EmployeeId { get; set; }
    public string EmployeeNo { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string? DepartmentName { get; set; }
    public string? ProfessionName { get; set; }
    public bool HasTimesheet { get; set; }
    public bool HasPayroll { get; set; }
    public int Year { get; set; }
    public int Month { get; set; }
}
