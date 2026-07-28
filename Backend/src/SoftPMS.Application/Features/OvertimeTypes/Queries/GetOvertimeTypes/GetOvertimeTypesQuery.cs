using MediatR;
using Microsoft.EntityFrameworkCore;
using SoftPMS.Application.Common.Interfaces;
using SoftPMS.Application.DTOs.OvertimeType;

namespace SoftPMS.Application.Features.OvertimeTypes.Queries.GetOvertimeTypes;

public record GetOvertimeTypesQuery(bool IncludeDeleted = false) : IRequest<List<OvertimeTypeDto>>;

public class GetOvertimeTypesQueryHandler : IRequestHandler<GetOvertimeTypesQuery, List<OvertimeTypeDto>>
{
    private readonly IApplicationDbContext _context;

    public GetOvertimeTypesQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<OvertimeTypeDto>> Handle(GetOvertimeTypesQuery request, CancellationToken cancellationToken)
    {
        var query = _context.OvertimeTypes.AsQueryable();
        
        if (request.IncludeDeleted)
        {
            query = query.IgnoreQueryFilters();
        }

        return await query
            .Select(x => new OvertimeTypeDto(x.Id, x.Name, x.Multiplier, !x.IsDeleted))
            .ToListAsync(cancellationToken);
    }
}
