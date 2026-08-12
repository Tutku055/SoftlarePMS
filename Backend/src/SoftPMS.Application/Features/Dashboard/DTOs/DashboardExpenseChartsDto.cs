using SoftPMS.Domain.Enums;

namespace SoftPMS.Application.Features.Dashboard.DTOs;

public class DashboardExpenseChartsDto
{
    public List<ExpenseDepartmentDto> MonthlyExpenses { get; set; } = new();
    public List<ExpenseDepartmentDto> HourlyExpenses { get; set; } = new();
}

public class ExpenseDepartmentDto
{
    public string DepartmentName { get; set; } = string.Empty;
    // Dictionary of Currency -> Total Amount. "Other" key is used if there are > 3 currencies.
    public Dictionary<string, decimal> ExpensesByCurrency { get; set; } = new();
}
