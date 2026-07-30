using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using SoftPMS.Application.Common.Interfaces;
using SoftPMS.Application.Features.Professions.DTOs;
using SoftPMS.Domain.Exceptions;

namespace SoftPMS.Application.Features.Professions.Queries.GetProfessionById;

public sealed class GetProfessionByIdQueryHandler(
    IApplicationDbContext context,
    IMapper mapper)
    : IRequestHandler<GetProfessionByIdQuery, ProfessionDto>
{
    public async Task<ProfessionDto> Handle(GetProfessionByIdQuery request, CancellationToken cancellationToken)
    {
        var profession = await context.Professions
            .Include(p => p.Employees)
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == request.Id, cancellationToken)
            ?? throw new NotFoundException(nameof(Domain.Entities.Profession), request.Id);

        return mapper.Map<ProfessionDto>(profession);
    }
}
