using MediatR;
using Microsoft.EntityFrameworkCore;
using SoftPMS.Application.Common.Exceptions;
using SoftPMS.Application.Common.Interfaces;
using SoftPMS.Domain.Entities;
using SoftPMS.Domain.Enums;

namespace SoftPMS.Application.Features.SystemSettings.Commands.CloseYearAndRolloverLeaves;

public class CloseYearAndRolloverLeavesCommandHandler : IRequestHandler<CloseYearAndRolloverLeavesCommand, Unit>
{
    private readonly IApplicationDbContext _context;

    public CloseYearAndRolloverLeavesCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Unit> Handle(CloseYearAndRolloverLeavesCommand request, CancellationToken cancellationToken)
    {
        // 1. Check if the year is already closed
        var isAlreadyClosed = await _context.YearlyRolloverLogs
            .AnyAsync(r => r.YearClosed == request.YearToClose, cancellationToken);

        if (isAlreadyClosed)
        {
            throw new BusinessRuleException($"The year {request.YearToClose} has already been closed.");
        }

        // 2. Open transaction
        using var transaction = await _context.BeginTransactionAsync(cancellationToken);

        try
        {
            // 3. Get all paid leaves for the year being closed, grouped by EmployeeId
            var usedLeaves = await _context.TimesheetEntries
                .Include(t => t.MonthlyTimesheet)
                .Where(t => t.Status == TimesheetStatus.PaidLeave && t.Date.Year == request.YearToClose)
                .GroupBy(t => t.MonthlyTimesheet.EmployeeId)
                .Select(g => new
                {
                    EmployeeId = g.Key,
                    UsedDays = g.Count() // Each entry represents a day
                })
                .ToDictionaryAsync(k => k.EmployeeId, v => v.UsedDays, cancellationToken);

            // 4. Fetch only monthly-salary active employees (hourly employees have no annual leave to roll over)
            var monthlyEmployeeIds = await _context.EmployeeCompensations
                .Where(c =>
                    c.SalaryType == SalaryType.Monthly
                    && c.EffectiveDate.Year <= request.YearToClose
                    && (c.EndDate == null || c.EndDate.Value.Year >= request.YearToClose))
                .Select(c => c.EmployeeId)
                .Distinct()
                .ToListAsync(cancellationToken);

            var activeEmployees = await _context.Employees
                .Where(e =>
                    !e.IsDeleted
                    && e.EmploymentStatus != EmploymentStatus.Terminated
                    && monthlyEmployeeIds.Contains(e.Id))
                .ToListAsync(cancellationToken);

            // 5. Calculate and update CarriedOverLeaves
            foreach (var emp in activeEmployees)
            {
                int usedDays = usedLeaves.ContainsKey(emp.Id) ? usedLeaves[emp.Id] : 0;
                
                // New CarriedOverLeaves = (Current AnnualVacationDays + Current CarriedOverLeaves) - UsedPaidLeaves
                // Floor at 0 so a heavy-leave-user doesn't get negative carry-over
                emp.CarriedOverLeaves = Math.Max(0, (emp.AnnualVacationDays + emp.CarriedOverLeaves) - usedDays);
            }

            // 6. Add YearlyRolloverLog record
            _context.YearlyRolloverLogs.Add(new YearlyRolloverLog
            {
                YearClosed = request.YearToClose,
                ClosedAt = DateTime.UtcNow
            });

            await _context.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
        }
        catch
        {
            await transaction.RollbackAsync(cancellationToken);
            throw;
        }

        return Unit.Value;
    }
}
