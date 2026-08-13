using MediatR;
using SoftPMS.Application.Features.Professions.DTOs;

namespace SoftPMS.Application.Features.Professions.Queries.GetProfessionsLookup;

/// <summary>
/// Represents the Query to get professions lookup.
/// </summary>
public sealed record GetProfessionsLookupQuery : IRequest<List<ProfessionLookupDto>>;


