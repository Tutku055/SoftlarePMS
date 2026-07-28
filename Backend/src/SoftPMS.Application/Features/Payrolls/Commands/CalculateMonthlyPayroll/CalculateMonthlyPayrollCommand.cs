using MediatR;
using Microsoft.EntityFrameworkCore;
using SoftPMS.Application.Common.Interfaces;
using SoftPMS.Domain.Entities;

namespace SoftPMS.Application.Features.Payrolls.Commands.CalculateMonthlyPayroll;

public record CalculateMonthlyPayrollCommand(Guid EmployeeId, int Year, int Month) : IRequest<Guid>;

public class CalculateMonthlyPayrollCommandHandler : IRequestHandler<CalculateMonthlyPayrollCommand, Guid>
{
    private readonly IApplicationDbContext _context;
    private readonly Microsoft.Extensions.Configuration.IConfiguration _configuration;

    public CalculateMonthlyPayrollCommandHandler(IApplicationDbContext context, Microsoft.Extensions.Configuration.IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }

    public async Task<Guid> Handle(CalculateMonthlyPayrollCommand request, CancellationToken cancellationToken)
    {
        var startOfMonth = new DateTime(request.Year, request.Month, 1);
        var endOfMonth = startOfMonth.AddMonths(1).AddDays(-1);

        // 1. Fetch timesheet with entries
        var timesheet = await _context.MonthlyTimesheets
            .Include(t => t.Entries)
                .ThenInclude(e => e.OvertimeType)
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

        var lineItems = new List<PayrollSlipLineItem>();
        
        decimal monthlyWorkingHours = 225m;
        var configStr = _configuration["PayrollSettings:MonthlyWorkingHours"];
        if (!string.IsNullOrEmpty(configStr) && decimal.TryParse(configStr, out var parsed))
        {
            monthlyWorkingHours = parsed;
        }
        
        int daysInMonth = DateTime.DaysInMonth(request.Year, request.Month);
        var monthlyCompDays = compensations
            .Where(c => c.SalaryType == Domain.Enums.SalaryType.Monthly)
            .Select(c => 
            {
                var ws = c.EffectiveDate > startOfMonth ? c.EffectiveDate : startOfMonth;
                var we = (c.EndDate != null && c.EndDate < endOfMonth) ? c.EndDate.Value : endOfMonth;
                return (we - ws).Days + 1;
            })
            .Sum();
            
        bool isFullMonthly = (monthlyCompDays == daysInMonth);
        var lastMonthlyComp = compensations.LastOrDefault(c => c.SalaryType == Domain.Enums.SalaryType.Monthly);

        foreach (var compensation in compensations)
        {
            if (!earningsByCurrency.ContainsKey(compensation.Currency))
            {
                earningsByCurrency[compensation.Currency] = 0;
                deductionsByCurrency[compensation.Currency] = 0;
                netSalaryByCurrency[compensation.Currency] = 0;
                baseSalaryByCurrency[compensation.Currency] = 0;
            }

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
                
                if (isFullMonthly && lastMonthlyComp != null && compensation.Id == lastMonthlyComp.Id)
                {
                    activeDaysInWindow += (30 - daysInMonth);
                }
                
                var unpaidCount = entriesInWindow.Count(e => e.Status == Domain.Enums.TimesheetStatus.UnpaidLeave);
                var absentCount = entriesInWindow.Count(e => e.Status == Domain.Enums.TimesheetStatus.Absent);

                var payableDays = activeDaysInWindow - (unpaidCount + absentCount);
                
                windowBaseSalary = payableDays * dailyRate;
                windowDeductions = (unpaidCount + absentCount) * dailyRate;
                
                lineItems.Add(new PayrollSlipLineItem
                {
                    ItemType = Domain.Enums.SlipItemType.Earning,
                    Description = $"Base Salary (Payable Days: {payableDays})",
                    Amount = windowBaseSalary
                });

                if (windowDeductions > 0)
                {
                    lineItems.Add(new PayrollSlipLineItem
                    {
                        ItemType = Domain.Enums.SlipItemType.Deduction,
                        Description = $"Absences/Unpaid Leaves ({unpaidCount + absentCount} days)",
                        Amount = windowDeductions
                    });
                }

                decimal hourlyRate = compensation.BaseSalary / monthlyWorkingHours;
                
                var unpaidHourlySum = entriesInWindow.Sum(e => e.UnpaidLeaveHours);
                if (unpaidHourlySum > 0)
                {
                    var hourlyDeduction = unpaidHourlySum * hourlyRate;
                    windowDeductions += hourlyDeduction;
                    lineItems.Add(new PayrollSlipLineItem
                    {
                        ItemType = Domain.Enums.SlipItemType.Deduction,
                        Description = $"Hourly Unpaid Leave ({unpaidHourlySum} hrs)",
                        Amount = hourlyDeduction
                    });
                }
                
                var paidHourlySum = entriesInWindow.Sum(e => e.PaidLeaveHours);
                if (paidHourlySum > 0)
                {
                    lineItems.Add(new PayrollSlipLineItem
                    {
                        ItemType = Domain.Enums.SlipItemType.Earning,
                        Description = $"Hourly Paid Leave ({paidHourlySum} hrs) - Included in Base",
                        Amount = 0m
                    });
                }
                
                var overtimeGroups = entriesInWindow.Where(e => e.OvertimeHours > 0)
                    .GroupBy(e => e.OvertimeTypeId)
                    .ToList();
                    
                foreach (var group in overtimeGroups)
                {
                    var firstOt = group.First();
                    var multiplier = firstOt.OvertimeType?.Multiplier ?? 1.5m;
                    var totalHours = group.Sum(e => e.OvertimeHours);
                    var amount = totalHours * hourlyRate * multiplier;
                    windowOvertime += amount;

                    lineItems.Add(new PayrollSlipLineItem
                    {
                        ItemType = Domain.Enums.SlipItemType.Earning,
                        Description = $"Overtime: {firstOt.OvertimeType?.Name ?? "Standard"} ({totalHours}h x {multiplier})",
                        Amount = amount
                    });
                }
            }
            else if (compensation.SalaryType == Domain.Enums.SalaryType.Hourly)
            {
                decimal hourlyWage = compensation.BaseSalary;
                var payableHourlyEntries = entriesInWindow.Where(e => e.Status == Domain.Enums.TimesheetStatus.Worked || e.Status == Domain.Enums.TimesheetStatus.PaidLeave || e.Status == Domain.Enums.TimesheetStatus.Holiday).ToList();
                var totalWorkedHours = payableHourlyEntries.Sum(e => e.WorkedHours);
                
                windowBaseSalary = totalWorkedHours * hourlyWage;
                
                lineItems.Add(new PayrollSlipLineItem
                {
                    ItemType = Domain.Enums.SlipItemType.Earning,
                    Description = $"Base Salary ({totalWorkedHours} hrs)",
                    Amount = windowBaseSalary
                });

                var overtimeGroups = entriesInWindow.Where(e => e.OvertimeHours > 0)
                    .GroupBy(e => e.OvertimeTypeId)
                    .ToList();
                    
                foreach (var group in overtimeGroups)
                {
                    var firstOt = group.First();
                    var multiplier = firstOt.OvertimeType?.Multiplier ?? 1.5m;
                    var totalHours = group.Sum(e => e.OvertimeHours);
                    var amount = totalHours * hourlyWage * multiplier;
                    windowOvertime += amount;

                    lineItems.Add(new PayrollSlipLineItem
                    {
                        ItemType = Domain.Enums.SlipItemType.Earning,
                        Description = $"Overtime: {firstOt.OvertimeType?.Name ?? "Standard"} ({totalHours}h x {multiplier})",
                        Amount = amount
                    });
                }
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

        var distinctTypes = compensations.Select(c => c.SalaryType.ToString()).Distinct().ToList();
        var salaryTypesString = string.Join(" & ", distinctTypes);

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
            SalaryTypes = salaryTypesString,
            IssueDate = DateTime.UtcNow,
            LineItems = lineItems
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
            existingSlip.SalaryTypes = payrollSlip.SalaryTypes;
            existingSlip.IssueDate = payrollSlip.IssueDate;
            
            // Overwrite old line items
            _context.PayrollSlipLineItems.RemoveRange(await _context.PayrollSlipLineItems.Where(l => l.PayrollSlipId == existingSlip.Id).ToListAsync(cancellationToken));
            foreach(var item in lineItems) {
                item.PayrollSlipId = existingSlip.Id;
                _context.PayrollSlipLineItems.Add(item);
            }

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
