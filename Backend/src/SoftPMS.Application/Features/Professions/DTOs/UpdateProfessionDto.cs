namespace SoftPMS.Application.Features.Professions.DTOs;

public sealed record UpdateProfessionDto(
    string Name,
    string Description,
    bool IsActive
);
