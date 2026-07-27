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
        // 1. Fetch latest compensation
        var compensation = await _context.EmployeeCompensations
            .FirstOrDefaultAsync(c => c.EmployeeId == request.EmployeeId, cancellationToken);

        if (compensation == null)
            throw new Exception("No active compensation found for employee.");

        // 2. Fetch timesheet
        var timesheet = await _context.MonthlyTimesheets
            .FirstOrDefaultAsync(t => t.EmployeeId == request.EmployeeId && t.Year == request.Year && t.Month == request.Month, cancellationToken);

        if (timesheet == null)
            throw new Exception("Timesheet not found for this month.");

        decimal deductions = 0;
        decimal overtimePay = 0;
        decimal totalEarnings = 0;
        decimal netSalary = 0;

        if (compensation.SalaryType == Domain.Enums.SalaryType.Monthly)
        {
            // 3. Daily Rate
            decimal dailyRate = compensation.BaseSalary / 30m;

            // 4. Deductions (Unpaid leaves + Absent days)
            var unpaidLeaveCount = await _context.TimesheetEntries
                .CountAsync(e => e.MonthlyTimesheetId == timesheet.Id && e.Status == Domain.Enums.TimesheetStatus.UnpaidLeave, cancellationToken);

            decimal totalDeductionDays = timesheet.TotalAbsentDays + unpaidLeaveCount;
            deductions = totalDeductionDays * dailyRate;

            // 5. Overtime Pay
            decimal hourlyRate = dailyRate / 8m;
            overtimePay = timesheet.TotalOvertimeHours * (hourlyRate * 1.5m);

            totalEarnings = compensation.BaseSalary + overtimePay;
            netSalary = compensation.BaseSalary - deductions + overtimePay;
        }
        else if (compensation.SalaryType == Domain.Enums.SalaryType.Hourly)
        {
            decimal hourlyWage = compensation.BaseSalary;
            decimal totalWorkedHours = timesheet.TotalWorkedDays * 8m;
            
            decimal regularPay = totalWorkedHours * hourlyWage;
            overtimePay = timesheet.TotalOvertimeHours * (hourlyWage * 1.5m);
            
            totalEarnings = regularPay + overtimePay;
            netSalary = totalEarnings - deductions;
        }

        // 7. Save PayrollSlip
        var payrollSlip = new PayrollSlip
        {
            EmployeeId = request.EmployeeId,
            Year = request.Year,
            Month = request.Month,
            BaseSalary = compensation.BaseSalary,
            TotalEarnings = totalEarnings,
            TotalDeductions = deductions,
            NetSalary = netSalary,
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
