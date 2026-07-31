using MediatR;
using Microsoft.EntityFrameworkCore;
using SoftPMS.Application.Common.Interfaces;
using SoftPMS.Application.Features.OvertimeTypes.DTOs;

namespace SoftPMS.Application.Features.OvertimeTypes.Queries.GetOvertimeTypes;

public sealed class GetOvertimeTypesQueryHandler(
    IApplicationDbContext context) : IRequestHandler<GetOvertimeTypesQuery, List<OvertimeTypeDto>>
{
    public async Task<List<OvertimeTypeDto>> Handle(GetOvertimeTypesQuery request, CancellationToken cancellationToken)
    {
        var query = context.OvertimeTypes.AsQueryable();
        
        if (request.IncludeDeleted)
        {
            query = query.IgnoreQueryFilters();
        }

        return await query
            .Select(x => new OvertimeTypeDto(x.Id, x.Name, x.Multiplier, !x.IsDeleted))
            .ToListAsync(cancellationToken);
    }
}
