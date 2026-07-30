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
        var isAlreadyClosed = await _context.YearlyRolloverLogs
            .AnyAsync(r => r.YearClosed == request.YearToClose, cancellationToken);

        if (isAlreadyClosed)
        {
            throw new BusinessRuleException($"The year {request.YearToClose} has already been closed.");
        }

        using var transaction = await _context.BeginTransactionAsync(cancellationToken);

        try
        {
            // Collect used paid-leave days per employee for the closed year.
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

            // Hourly employees have no annual leave entitlement; only monthly employees are processed.
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

            // CarriedOverLeaves = max(0, AnnualVacationDays + CarriedOverLeaves - UsedPaidLeaves)
            foreach (var emp in activeEmployees)
            {
                int usedDays = usedLeaves.ContainsKey(emp.Id) ? usedLeaves[emp.Id] : 0;
                emp.CarriedOverLeaves = Math.Max(0, (emp.AnnualVacationDays + emp.CarriedOverLeaves) - usedDays);
            }

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
