namespace SoftPMS.Application.Features.Professions.DTOs;

public sealed record CreateProfessionDto(
    string Name,
    string Description,
    bool IsActive
);
