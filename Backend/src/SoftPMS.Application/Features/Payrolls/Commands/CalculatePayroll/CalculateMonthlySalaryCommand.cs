using MediatR;
using Microsoft.EntityFrameworkCore;
using SoftPMS.Application.Common.Interfaces;
using SoftPMS.Domain.Entities;
using SoftPMS.Application.Common.Exceptions;
using FluentValidation.Results;
using SoftPMS.Domain.Exceptions;

namespace SoftPMS.Application.Features.Payrolls.Commands.CalculatePayroll;

public record CalculateMonthlySalaryCommand(Guid EmployeeId, int Year, int Month, Guid CompensationId) : IRequest<Guid>;

public class CalculateMonthlySalaryCommandHandler : IRequestHandler<CalculateMonthlySalaryCommand, Guid>
{
    private readonly IApplicationDbContext _context;
    private readonly Microsoft.Extensions.Configuration.IConfiguration _configuration;

    public CalculateMonthlySalaryCommandHandler(IApplicationDbContext context, Microsoft.Extensions.Configuration.IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }

    public async Task<Guid> Handle(CalculateMonthlySalaryCommand request, CancellationToken cancellationToken)
    {
        var startOfMonthDate = new DateTime(request.Year, request.Month, 1);
        var endOfMonthDate = new DateTime(request.Year, request.Month, DateTime.DaysInMonth(request.Year, request.Month));

        var timesheet = await _context.MonthlyTimesheets
            .Include(t => t.Entries)
                .ThenInclude(e => e.OvertimeType)
            .FirstOrDefaultAsync(t => t.EmployeeId == request.EmployeeId && t.Year == request.Year && t.Month == request.Month, cancellationToken);

        if (timesheet == null)
            throw new NotFoundException("MonthlyTimesheet", $"{request.EmployeeId}/{request.Year}/{request.Month}");

        var compensation = await _context.EmployeeCompensations
            .FirstOrDefaultAsync(c => c.Id == request.CompensationId, cancellationToken);

        if (compensation == null)
            throw new NotFoundException("EmployeeCompensation", request.CompensationId);

        var employee = await _context.Employees.FindAsync(new object[] { request.EmployeeId }, cancellationToken);

        var lineItems = new List<PayrollSlipLineItem>();
        
        decimal monthlyWorkingHours = 225m;
        var configStr = _configuration["PayrollSettings:MonthlyWorkingHours"];
        if (!string.IsNullOrEmpty(configStr) && decimal.TryParse(configStr, out var parsed))
        {
            monthlyWorkingHours = parsed;
        }

        int daysInMonth = DateTime.DaysInMonth(request.Year, request.Month);
        
        var effectiveStart = startOfMonthDate;
        if (employee.HireDate > startOfMonthDate)
        {
            effectiveStart = employee.HireDate.Date;
        }
        
        var windowEnd = endOfMonthDate;
        if (compensation.EndDate != null && compensation.EndDate.Value.Date < endOfMonthDate)
        {
            windowEnd = compensation.EndDate.Value.Date;
        }

        int payableDays = 0;
        if (effectiveStart <= windowEnd)
        {
            payableDays = (windowEnd - effectiveStart).Days + 1;
        }
        
        // Use a 30-day standard for a full calendar month regardless of actual days.
        if (payableDays == daysInMonth) 
        {
            payableDays = 30;
        }

        decimal dailyRate = compensation.BaseSalary / 30m;
        decimal baseSalary = payableDays * dailyRate;

        lineItems.Add(new PayrollSlipLineItem
        {
            ItemType = Domain.Enums.SlipItemType.Earning,
            Description = $"Base Salary ({payableDays} days)",
            Amount = baseSalary,
            Currency = compensation.Currency
        });

        // Only count entries from the employee's effective window (hire date / compensation end date).
        var entriesInWindow = timesheet.Entries.Where(e => e.Date.Date >= effectiveStart && e.Date.Date <= windowEnd).ToList();
        
        var unpaidCount = entriesInWindow.Count(e => e.Status == Domain.Enums.TimesheetStatus.UnpaidLeave);
        var absentCount = entriesInWindow.Count(e => e.Status == Domain.Enums.TimesheetStatus.Absent);
        var paidLeaveCount = entriesInWindow.Count(e => e.Status == Domain.Enums.TimesheetStatus.PaidLeave);

        decimal deductions = 0;

        if (paidLeaveCount > 0)
        {
            lineItems.Add(new PayrollSlipLineItem
            {
                ItemType = Domain.Enums.SlipItemType.Earning,
                Description = $"Paid Leave ({paidLeaveCount} days) - Included in Base",
                Amount = 0m,
                Currency = compensation.Currency
            });
        }

        if (unpaidCount > 0)
        {
            decimal unpaidDeduction = unpaidCount * dailyRate;
            deductions += unpaidDeduction;
            lineItems.Add(new PayrollSlipLineItem
            {
                ItemType = Domain.Enums.SlipItemType.Deduction,
                Description = $"Unpaid Leaves ({unpaidCount} days)",
                Amount = unpaidDeduction,
                Currency = compensation.Currency
            });
        }

        if (absentCount > 0)
        {
            decimal absentDeduction = absentCount * dailyRate;
            deductions += absentDeduction;
            lineItems.Add(new PayrollSlipLineItem
            {
                ItemType = Domain.Enums.SlipItemType.Deduction,
                Description = $"Absences ({absentCount} days)",
                Amount = absentDeduction,
                Currency = compensation.Currency
            });
        }

        decimal hourlyRate = compensation.BaseSalary / monthlyWorkingHours;
        
        var unpaidHourlySum = entriesInWindow.Sum(e => e.UnpaidLeaveHours);
        if (unpaidHourlySum > 0)
        {
            var hourlyDeduction = unpaidHourlySum * hourlyRate;
            deductions += hourlyDeduction;
            lineItems.Add(new PayrollSlipLineItem
            {
                ItemType = Domain.Enums.SlipItemType.Deduction,
                Description = $"Hourly Unpaid Leave ({unpaidHourlySum} hrs)",
                Amount = hourlyDeduction,
                Currency = compensation.Currency
            });
        }
        
        var paidHourlySum = entriesInWindow.Sum(e => e.PaidLeaveHours);
        if (paidHourlySum > 0)
        {
            lineItems.Add(new PayrollSlipLineItem
            {
                ItemType = Domain.Enums.SlipItemType.Earning,
                Description = $"Hourly Paid Leave ({paidHourlySum} hrs) - Included in Base",
                Amount = 0m,
                Currency = compensation.Currency
            });
        }

        decimal totalOvertime = 0;
        var overtimeGroups = entriesInWindow.Where(e => e.OvertimeHours > 0)
            .GroupBy(e => e.OvertimeTypeId)
            .ToList();
            
        foreach (var group in overtimeGroups)
        {
            var firstOt = group.First();
            var multiplier = firstOt.OvertimeType?.Multiplier ?? 1.5m;
            var totalHours = group.Sum(e => e.OvertimeHours);
            var amount = totalHours * hourlyRate * multiplier;
            totalOvertime += amount;

            lineItems.Add(new PayrollSlipLineItem
            {
                ItemType = Domain.Enums.SlipItemType.Earning,
                Description = $"Overtime: {firstOt.OvertimeType?.Name ?? "Standard"} ({totalHours}h x {multiplier})",
                Amount = amount,
                Currency = compensation.Currency
            });
        }

        decimal totalEarnings = baseSalary + totalOvertime;
        decimal netSalary = totalEarnings - deductions;

        var payrollSlip = new PayrollSlip
        {
            EmployeeId = request.EmployeeId,
            Year = request.Year,
            Month = request.Month,
            BaseSalary = $"{baseSalary:F2} {compensation.Currency}",
            TotalEarnings = $"{totalEarnings:F2} {compensation.Currency}",
            TotalDeductions = $"{deductions:F2} {compensation.Currency}",
            NetSalary = $"{netSalary:F2} {compensation.Currency}",
            SalaryTypes = compensation.SalaryType.ToString(),
            IssueDate = DateTime.UtcNow,
            LineItems = lineItems
        };

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
