using MediatR;
using SoftPMS.Application.Features.Professions.DTOs;

namespace SoftPMS.Application.Features.Professions.Queries.GetProfessionById;

public sealed record GetProfessionByIdQuery(Guid Id) : IRequest<ProfessionDto>;
