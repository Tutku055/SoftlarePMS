namespace SoftPMS.Application.DTOs.Payroll;

public record PayrollSlipDto(
    Guid Id,
    Guid EmployeeId,
    int Year,
    int Month,
    decimal BaseSalary,
    decimal TotalEarnings,
    decimal TotalDeductions,
    decimal NetSalary,
    DateTime IssueDate
);
