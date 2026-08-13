using MediatR;

namespace SoftPMS.Application.Features.Professions.Commands.DeleteProfession;

/// <summary>
/// Represents the Command to delete profession.
/// </summary>
public sealed record DeleteProfessionCommand(
    Guid Id,
    bool HardDelete = false
) : IRequest;


