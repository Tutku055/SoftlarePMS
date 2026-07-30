using MediatR;
using SoftPMS.Application.Common.Interfaces;
using SoftPMS.Application.Common.Settings;
using Microsoft.Extensions.Options;
using Microsoft.EntityFrameworkCore;

namespace SoftPMS.Application.Features.SystemSettings.Queries.CheckYearClosure;

public record CheckYearClosureQuery(int Year) : IRequest<bool>;

public class CheckYearClosureQueryHandler : IRequestHandler<CheckYearClosureQuery, bool>
{
    private readonly IApplicationDbContext _context;
    private readonly SoftPMS.Application.Common.Settings.SystemSettings _settings;

    public CheckYearClosureQueryHandler(IApplicationDbContext context, IOptions<SoftPMS.Application.Common.Settings.SystemSettings> options)
    {
        _context = context;
        _settings = options.Value;
    }

    public async Task<bool> Handle(CheckYearClosureQuery request, CancellationToken cancellationToken)
    {
        if (request.Year <= _settings.GoLiveYear)
            return false;

        var isPrevYearClosed = await _context.YearlyRolloverLogs
            .AnyAsync(r => r.YearClosed == request.Year - 1, cancellationToken);
            
        return !isPrevYearClosed;
    }
}
