namespace SoftPMS.Application.Features.Payrolls.DTOs;

public record PayrollSlipDto(
    Guid Id,
    Guid EmployeeId,
    int Year,
    int Month,
    string BaseSalary,
    string TotalEarnings,
    string TotalDeductions,
    string NetSalary,
    string SalaryTypes,
    DateTime IssueDate,
    List<PayrollSlipLineItemDto> LineItems
);
