namespace SoftPMS.Application.Features.Payrolls.DTOs;

public record PayrollSlipLineItemDto(
    Guid Id,
    int ItemType,
    string Description,
    decimal Amount,
    int Currency
);
