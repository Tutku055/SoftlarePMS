namespace SoftPMS.Application.DTOs.Payroll;

public record PayrollSlipLineItemDto(
    Guid Id,
    int ItemType,
    string Description,
    decimal Amount
);
