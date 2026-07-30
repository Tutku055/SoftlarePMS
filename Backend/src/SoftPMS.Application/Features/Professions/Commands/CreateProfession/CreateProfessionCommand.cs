using MediatR;
using SoftPMS.Application.Features.Professions.DTOs;

namespace SoftPMS.Application.Features.Professions.Commands.CreateProfession;

public sealed record CreateProfessionCommand(
    string Name,
    string Description,
    bool IsActive
) : IRequest<ProfessionDto>;
