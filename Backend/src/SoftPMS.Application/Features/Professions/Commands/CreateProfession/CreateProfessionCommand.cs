using MediatR;
using SoftPMS.Application.Features.Professions.DTOs;

namespace SoftPMS.Application.Features.Professions.Commands.CreateProfession;

/// <summary>
/// Represents the Command to create profession.
/// </summary>
public sealed record CreateProfessionCommand(
    string Name,
    string Description,
    bool IsActive
) : IRequest<ProfessionDto>;


