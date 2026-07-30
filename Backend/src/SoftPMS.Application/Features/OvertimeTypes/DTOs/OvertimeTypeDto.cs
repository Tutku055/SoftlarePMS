namespace SoftPMS.Application.Features.OvertimeTypes.DTOs;

public record OvertimeTypeDto(Guid Id, string Name, decimal Multiplier, bool IsActive);
