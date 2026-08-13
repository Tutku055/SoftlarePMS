using MediatR;
using SoftPMS.Application.Features.Professions.DTOs;

namespace SoftPMS.Application.Features.Professions.Queries.GetProfessionById;

/// <summary>
/// Represents the Query to get profession by id.
/// </summary>
public sealed record GetProfessionByIdQuery(Guid Id) : IRequest<ProfessionDto>;



