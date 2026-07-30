using MediatR;
using SoftPMS.Application.Features.Professions.DTOs;

namespace SoftPMS.Application.Features.Professions.Queries.GetProfessionsLookup;

public sealed record GetProfessionsLookupQuery : IRequest<List<ProfessionLookupDto>>;
