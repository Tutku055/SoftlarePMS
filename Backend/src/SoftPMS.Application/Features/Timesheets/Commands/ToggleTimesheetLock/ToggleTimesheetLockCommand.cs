using MediatR;
using Microsoft.EntityFrameworkCore;
using SoftPMS.Application.Common.Interfaces;
using SoftPMS.Application.Common.Exceptions;

namespace SoftPMS.Application.Features.Timesheets.Commands.ToggleTimesheetLock;

public record ToggleTimesheetLockCommand(Guid EmployeeId, int Year, int Month, bool Lock) : IRequest<bool>;

public class ToggleTimesheetLockCommandHandler : IRequestHandler<ToggleTimesheetLockCommand, bool>
{
    private readonly IApplicationDbContext _context;

    public ToggleTimesheetLockCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<bool> Handle(ToggleTimesheetLockCommand request, CancellationToken cancellationToken)
    {
        var timesheet = await _context.MonthlyTimesheets
            .FirstOrDefaultAsync(t => t.EmployeeId == request.EmployeeId && t.Year == request.Year && t.Month == request.Month, cancellationToken);

        if (timesheet == null)
            throw new Exception("Timesheet not found");

        timesheet.IsLocked = request.Lock;
        _context.MonthlyTimesheets.Update(timesheet);
        await _context.SaveChangesAsync(cancellationToken);

        return true;
    }
}
