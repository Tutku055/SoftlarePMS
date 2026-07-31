using MediatR;
using Microsoft.EntityFrameworkCore;
using SoftPMS.Application.Common.Interfaces;
using SoftPMS.Domain.Entities;
using SoftPMS.Application.Common.Exceptions;
using FluentValidation.Results;
using SoftPMS.Domain.Exceptions;

namespace SoftPMS.Application.Features.Payrolls.Commands.CalculatePayroll;

public sealed class CalculateHourlySalaryCommandHandler(
    IApplicationDbContext context) : IRequestHandler<CalculateHourlySalaryCommand, Guid>
{
    public async Task<Guid> Handle(CalculateHourlySalaryCommand request, CancellationToken cancellationToken)
    {
        var timesheet = await context.MonthlyTimesheets
            .Include(t => t.Entries)
                .ThenInclude(e => e.OvertimeType)
            .FirstOrDefaultAsync(t => t.EmployeeId == request.EmployeeId && t.Year == request.Year && t.Month == request.Month, cancellationToken);

        if (timesheet == null)
            throw new NotFoundException("MonthlyTimesheet", $"{request.EmployeeId}/{request.Year}/{request.Month}");

        var compensation = await context.EmployeeCompensations
            .FirstOrDefaultAsync(c => c.Id == request.CompensationId, cancellationToken);

        if (compensation == null)
            throw new NotFoundException("EmployeeCompensation", request.CompensationId);

        var employee = await context.Employees.FindAsync(new object[] { request.EmployeeId }, cancellationToken);

        var lineItems = new List<PayrollSlipLineItem>();
        
        decimal hourlyWage = compensation.BaseSalary;
        
        // Base salary covers Worked, PaidLeave and Holiday hours; Absent/UnpaidLeave/NotEmployed = 0 hrs, no deduction needed.
        // Note: TimesheetStatus.NotEmployed is strictly IGNORED during earning and deduction calculations.
        var payableHourlyEntries = timesheet.Entries.Where(e => 
            e.Status == Domain.Enums.TimesheetStatus.Worked || 
            e.Status == Domain.Enums.TimesheetStatus.PaidLeave || 
            e.Status == Domain.Enums.TimesheetStatus.Holiday).ToList();
            
        var totalWorkedHours = payableHourlyEntries.Sum(e => e.WorkedHours);
        
        decimal baseSalary = totalWorkedHours * hourlyWage;
        
        lineItems.Add(new PayrollSlipLineItem
        {
            ItemType = Domain.Enums.SlipItemType.Earning,
            Description = $"Base Salary ({totalWorkedHours} hrs)",
            Amount = baseSalary,
            Currency = compensation.Currency
        });

        // Absent and UnpaidLeave aren't deducted — they simply contributed 0 hours to the total.
        // Zero-amount line items are added for payslip transparency.
        var unpaidCount = timesheet.Entries.Count(e => e.Status == Domain.Enums.TimesheetStatus.UnpaidLeave);
        var absentCount = timesheet.Entries.Count(e => e.Status == Domain.Enums.TimesheetStatus.Absent);

        if (unpaidCount > 0)
        {
            lineItems.Add(new PayrollSlipLineItem
            {
                ItemType = Domain.Enums.SlipItemType.Deduction,
                Description = $"Unpaid Leaves ({unpaidCount} days)",
                Amount = 0m,
                Currency = compensation.Currency
            });
        }

        if (absentCount > 0)
        {
            lineItems.Add(new PayrollSlipLineItem
            {
                ItemType = Domain.Enums.SlipItemType.Deduction,
                Description = $"Absences ({absentCount} days)",
                Amount = 0m,
                Currency = compensation.Currency
            });
        }

        decimal totalOvertime = 0;
        var overtimeGroups = timesheet.Entries.Where(e => e.OvertimeHours > 0)
            .GroupBy(e => e.OvertimeTypeId)
            .ToList();
            
        foreach (var group in overtimeGroups)
        {
            var firstOt = group.First();
            var multiplier = firstOt.OvertimeType?.Multiplier ?? 1.5m;
            var totalHours = group.Sum(e => e.OvertimeHours);
            var amount = totalHours * hourlyWage * multiplier;
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
        decimal totalDeductions = 0;
        decimal netSalary = totalEarnings - totalDeductions;

        var payrollSlip = new PayrollSlip
        {
            EmployeeId = request.EmployeeId,
            Year = request.Year,
            Month = request.Month,
            BaseSalary = $"{baseSalary:F2} {compensation.Currency}",
            TotalEarnings = $"{totalEarnings:F2} {compensation.Currency}",
            TotalDeductions = $"{totalDeductions:F2} {compensation.Currency}",
            NetSalary = $"{netSalary:F2} {compensation.Currency}",
            SalaryTypes = compensation.SalaryType.ToString(),
            IssueDate = DateTime.UtcNow,
            LineItems = lineItems
        };

        var existingSlip = await context.PayrollSlips
            .FirstOrDefaultAsync(p => p.EmployeeId == request.EmployeeId && p.Year == request.Year && p.Month == request.Month, cancellationToken);

        if (existingSlip != null)
        {
            existingSlip.BaseSalary = payrollSlip.BaseSalary;
            existingSlip.TotalEarnings = payrollSlip.TotalEarnings;
            existingSlip.TotalDeductions = payrollSlip.TotalDeductions;
            existingSlip.NetSalary = payrollSlip.NetSalary;
            existingSlip.SalaryTypes = payrollSlip.SalaryTypes;
            existingSlip.IssueDate = payrollSlip.IssueDate;
            
            context.PayrollSlipLineItems.RemoveRange(await context.PayrollSlipLineItems.Where(l => l.PayrollSlipId == existingSlip.Id).ToListAsync(cancellationToken));
            foreach(var item in lineItems) {
                item.PayrollSlipId = existingSlip.Id;
                context.PayrollSlipLineItems.Add(item);
            }

            context.PayrollSlips.Update(existingSlip);
            await context.SaveChangesAsync(cancellationToken);
            return existingSlip.Id;
        }
        else
        {
            context.PayrollSlips.Add(payrollSlip);
            await context.SaveChangesAsync(cancellationToken);
            return payrollSlip.Id;
        }
    }
}
