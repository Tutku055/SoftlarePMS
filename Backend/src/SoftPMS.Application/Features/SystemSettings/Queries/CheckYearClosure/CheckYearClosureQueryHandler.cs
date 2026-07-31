using MediatR;
using SoftPMS.Application.Common.Interfaces;
using SoftPMS.Application.Common.Settings;
using Microsoft.Extensions.Options;
using Microsoft.EntityFrameworkCore;

namespace SoftPMS.Application.Features.SystemSettings.Queries.CheckYearClosure;

public sealed class CheckYearClosureQueryHandler(
    IApplicationDbContext context, 
    IOptions<SoftPMS.Application.Common.Settings.SystemSettings> options) : IRequestHandler<CheckYearClosureQuery, bool>
{
    public async Task<bool> Handle(CheckYearClosureQuery request, CancellationToken cancellationToken)
    {
        if (request.Year <= options.Value.GoLiveYear)
            return false;

        var isPrevYearClosed = await context.YearlyRolloverLogs
            .AnyAsync(r => r.YearClosed == request.Year - 1, cancellationToken);
            
        return !isPrevYearClosed;
    }
}
