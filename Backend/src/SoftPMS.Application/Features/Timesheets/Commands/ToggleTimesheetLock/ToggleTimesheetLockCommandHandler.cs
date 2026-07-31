using MediatR;
using Microsoft.EntityFrameworkCore;
using SoftPMS.Application.Common.Interfaces;

namespace SoftPMS.Application.Features.Timesheets.Commands.ToggleTimesheetLock;

public sealed class ToggleTimesheetLockCommandHandler(IApplicationDbContext context) : IRequestHandler<ToggleTimesheetLockCommand, bool>
{
    public async Task<bool> Handle(ToggleTimesheetLockCommand request, CancellationToken cancellationToken)
    {
        var timesheet = await context.MonthlyTimesheets
            .FirstOrDefaultAsync(t => t.EmployeeId == request.EmployeeId && t.Year == request.Year && t.Month == request.Month, cancellationToken);

        if (timesheet == null)
            throw new Exception("Timesheet not found");

        timesheet.IsLocked = request.Lock;
        context.MonthlyTimesheets.Update(timesheet);
        await context.SaveChangesAsync(cancellationToken);

        return true;
    }
}
