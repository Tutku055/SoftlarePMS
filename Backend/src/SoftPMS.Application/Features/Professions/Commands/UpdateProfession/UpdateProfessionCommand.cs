using MediatR;

namespace SoftPMS.Application.Features.Professions.Commands.UpdateProfession;

/// <summary>
/// Represents the Command to update profession.
/// </summary>
public sealed record UpdateProfessionCommand(
    Guid Id,
    string Name,
    string Description,
    bool IsActive
) : IRequest;


