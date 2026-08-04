using SoftPMS.Domain.Enums;

namespace SoftPMS.Application.Features.Payrolls.DTOs;

public record PayrollSlipLineItemDto(
    Guid Id,
    SlipItemType ItemType,
    string Description,
    decimal Amount,
    Currency Currency
);

