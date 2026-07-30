using MediatR;

namespace SoftPMS.Application.Features.Professions.Commands.UpdateProfession;

public sealed record UpdateProfessionCommand(
    Guid Id,
    string Name,
    string Description,
    bool IsActive
) : IRequest;
