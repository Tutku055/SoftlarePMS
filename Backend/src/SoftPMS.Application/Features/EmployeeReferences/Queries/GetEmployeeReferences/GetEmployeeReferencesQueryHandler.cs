using AutoMapper;
using AutoMapper.QueryableExtensions;
using MediatR;
using Microsoft.EntityFrameworkCore;
using SoftPMS.Application.Common.Interfaces;
using SoftPMS.Application.DTOs.EmployeeReference;

namespace SoftPMS.Application.Features.EmployeeReferences.Queries.GetEmployeeReferences;

public sealed class GetEmployeeReferencesQueryHandler(
    IApplicationDbContext context,
    IMapper mapper) : IRequestHandler<GetEmployeeReferencesQuery, List<EmployeeReferenceDto>>
{
    public async Task<List<EmployeeReferenceDto>> Handle(GetEmployeeReferencesQuery request, CancellationToken cancellationToken)
    {
        return await context.EmployeeReferences
            .AsNoTracking()
            .Where(r => r.EmployeeId == request.EmployeeId)
            .OrderByDescending(r => r.CreatedAt)
            .ProjectTo<EmployeeReferenceDto>(mapper.ConfigurationProvider)
            .ToListAsync(cancellationToken);
    }
}
