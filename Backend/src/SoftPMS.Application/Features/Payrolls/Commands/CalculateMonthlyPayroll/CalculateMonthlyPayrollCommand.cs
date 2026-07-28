using MediatR;
using Microsoft.EntityFrameworkCore;
using SoftPMS.Application.Common.Interfaces;
using SoftPMS.Domain.Entities;

namespace SoftPMS.Application.Features.Payrolls.Commands.CalculateMonthlyPayroll;

public record CalculateMonthlyPayrollCommand(Guid EmployeeId, int Year, int Month) : IRequest<Guid>;

public class CalculateMonthlyPayrollCommandHandler : IRequestHandler<CalculateMonthlyPayrollCommand, Guid>
{
    private readonly IApplicationDbContext _context;

    public CalculateMonthlyPayrollCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Guid> Handle(CalculateMonthlyPayrollCommand request, CancellationToken cancellationToken)
    {
        var startOfMonth = new DateTime(request.Year, request.Month, 1);
        var endOfMonth = startOfMonth.AddMonths(1).AddDays(-1);

        // 1. Fetch timesheet with entries
        var timesheet = await _context.MonthlyTimesheets
            .Include(t => t.Entries)
            .FirstOrDefaultAsync(t => t.EmployeeId == request.EmployeeId && t.Year == request.Year && t.Month == request.Month, cancellationToken);

        if (timesheet == null)
            throw new Exception("Timesheet not found for this month.");

        // 2. Fetch all compensations active during this month
        var compensations = await _context.EmployeeCompensations
            .Where(c => c.EmployeeId == request.EmployeeId && c.EffectiveDate <= endOfMonth && (c.EndDate == null || c.EndDate >= startOfMonth))
            .OrderBy(c => c.EffectiveDate)
            .ToListAsync(cancellationToken);

        if (!compensations.Any())
            throw new Exception("No active compensation found for employee in the given month.");

        var earningsByCurrency = new Dictionary<Domain.Enums.Currency, decimal>();
        var deductionsByCurrency = new Dictionary<Domain.Enums.Currency, decimal>();
        var netSalaryByCurrency = new Dictionary<Domain.Enums.Currency, decimal>();
        var baseSalaryByCurrency = new Dictionary<Domain.Enums.Currency, decimal>();

        foreach (var compensation in compensations)
        {
            if (!earningsByCurrency.ContainsKey(compensation.Currency))
            {
                earningsByCurrency[compensation.Currency] = 0;
                deductionsByCurrency[compensation.Currency] = 0;
                netSalaryByCurrency[compensation.Currency] = 0;
                baseSalaryByCurrency[compensation.Currency] = 0;
            }

            // Determine active window for this compensation within this month
            var windowStart = compensation.EffectiveDate > startOfMonth ? compensation.EffectiveDate : startOfMonth;
            var windowEnd = (compensation.EndDate != null && compensation.EndDate < endOfMonth) ? compensation.EndDate.Value : endOfMonth;
            
            var entriesInWindow = timesheet.Entries.Where(e => e.Date >= windowStart && e.Date <= windowEnd).ToList();
            
            decimal windowBaseSalary = 0;
            decimal windowDeductions = 0;
            decimal windowOvertime = 0;

            if (compensation.SalaryType == Domain.Enums.SalaryType.Monthly)
            {
                decimal dailyRate = compensation.BaseSalary / 30m;
                int activeDaysInWindow = (windowEnd - windowStart).Days + 1;
                
                windowBaseSalary = dailyRate * activeDaysInWindow;

                var unpaidCount = entriesInWindow.Count(e => e.Status == Domain.Enums.TimesheetStatus.UnpaidLeave);
                var absentCount = entriesInWindow.Count(e => e.Status == Domain.Enums.TimesheetStatus.Absent);

                windowDeductions = (unpaidCount + absentCount) * dailyRate;

                decimal hourlyRate = dailyRate / 8m;
                decimal overtimeHours = entriesInWindow.Sum(e => e.OvertimeHours);
                windowOvertime = overtimeHours * (hourlyRate * 1.5m);
            }
            else if (compensation.SalaryType == Domain.Enums.SalaryType.Hourly)
            {
                decimal hourlyWage = compensation.BaseSalary;
                var workedDays = entriesInWindow.Count(e => e.Status == Domain.Enums.TimesheetStatus.Worked);
                var workedHours = workedDays * 8m;
                var overtimeHours = entriesInWindow.Sum(e => e.OvertimeHours);
                
                windowBaseSalary = workedHours * hourlyWage;
                windowOvertime = overtimeHours * (hourlyWage * 1.5m);
            }

            earningsByCurrency[compensation.Currency] += windowBaseSalary + windowOvertime;
            deductionsByCurrency[compensation.Currency] += windowDeductions;
            netSalaryByCurrency[compensation.Currency] += (windowBaseSalary + windowOvertime) - windowDeductions;
            baseSalaryByCurrency[compensation.Currency] += windowBaseSalary;
        }

        string FormatMultiCurrency(Dictionary<Domain.Enums.Currency, decimal> map)
        {
            if (!map.Any()) return "0";
            var validEntries = map.Where(kv => kv.Value != 0).ToList();
            if (!validEntries.Any()) return $"0.00 {map.First().Key}";
            return string.Join(" + ", validEntries.Select(kv => $"{kv.Value:F2} {kv.Key}"));
        }

        // 7. Save PayrollSlip
        var payrollSlip = new PayrollSlip
        {
            EmployeeId = request.EmployeeId,
            Year = request.Year,
            Month = request.Month,
            BaseSalary = FormatMultiCurrency(baseSalaryByCurrency),
            TotalEarnings = FormatMultiCurrency(earningsByCurrency),
            TotalDeductions = FormatMultiCurrency(deductionsByCurrency),
            NetSalary = FormatMultiCurrency(netSalaryByCurrency),
            IssueDate = DateTime.UtcNow
        };

        // Check if exists
        var existingSlip = await _context.PayrollSlips
            .FirstOrDefaultAsync(p => p.EmployeeId == request.EmployeeId && p.Year == request.Year && p.Month == request.Month, cancellationToken);

        if (existingSlip != null)
        {
            existingSlip.BaseSalary = payrollSlip.BaseSalary;
            existingSlip.TotalEarnings = payrollSlip.TotalEarnings;
            existingSlip.TotalDeductions = payrollSlip.TotalDeductions;
            existingSlip.NetSalary = payrollSlip.NetSalary;
            existingSlip.IssueDate = payrollSlip.IssueDate;
            _context.PayrollSlips.Update(existingSlip);
            await _context.SaveChangesAsync(cancellationToken);
            return existingSlip.Id;
        }
        else
        {
            _context.PayrollSlips.Add(payrollSlip);
            await _context.SaveChangesAsync(cancellationToken);
            return payrollSlip.Id;
        }
    }
}
