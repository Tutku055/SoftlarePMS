namespace SoftPMS.Application.DTOs.OvertimeType;

public record OvertimeTypeDto(Guid Id, string Name, decimal Multiplier, bool IsActive);
