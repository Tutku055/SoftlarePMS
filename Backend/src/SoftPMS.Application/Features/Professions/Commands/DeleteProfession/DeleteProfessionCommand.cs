using MediatR;

namespace SoftPMS.Application.Features.Professions.Commands.DeleteProfession;

public sealed record DeleteProfessionCommand(
    Guid Id,
    bool HardDelete = false
) : IRequest;
