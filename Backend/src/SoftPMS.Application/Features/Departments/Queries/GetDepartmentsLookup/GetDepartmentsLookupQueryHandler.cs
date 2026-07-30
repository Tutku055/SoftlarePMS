using AutoMapper;
using AutoMapper.QueryableExtensions;
using MediatR;
using Microsoft.EntityFrameworkCore;
using SoftPMS.Application.Common.Interfaces;
using SoftPMS.Application.Features.Departments.DTOs;

namespace SoftPMS.Application.Features.Departments.Queries.GetDepartmentsLookup;

public sealed class GetDepartmentsLookupQueryHandler(
    IApplicationDbContext context,
    IMapper mapper)
    : IRequestHandler<GetDepartmentsLookupQuery, List<DepartmentLookupDto>>
{
    public async Task<List<DepartmentLookupDto>> Handle(
        GetDepartmentsLookupQuery request,
        CancellationToken cancellationToken)
    {
        return await context.Departments
            .AsNoTracking()
            .OrderBy(d => d.Name)
            .ProjectTo<DepartmentLookupDto>(mapper.ConfigurationProvider)
            .ToListAsync(cancellationToken);
    }
}
