using AutoMapper;
using AutoMapper.QueryableExtensions;
using MediatR;
using Microsoft.EntityFrameworkCore;
using SoftPMS.Application.Common.Interfaces;
using SoftPMS.Application.Features.Professions.DTOs;

namespace SoftPMS.Application.Features.Professions.Queries.GetProfessionsLookup;

public sealed class GetProfessionsLookupQueryHandler(
    IApplicationDbContext context,
    IMapper mapper)
    : IRequestHandler<GetProfessionsLookupQuery, List<ProfessionLookupDto>>
{
    public async Task<List<ProfessionLookupDto>> Handle(GetProfessionsLookupQuery request, CancellationToken cancellationToken)
    {
        return await context.Professions
            .Where(p => p.IsActive)
            .OrderBy(p => p.Name)
            .ProjectTo<ProfessionLookupDto>(mapper.ConfigurationProvider)
            .ToListAsync(cancellationToken);
    }
}
