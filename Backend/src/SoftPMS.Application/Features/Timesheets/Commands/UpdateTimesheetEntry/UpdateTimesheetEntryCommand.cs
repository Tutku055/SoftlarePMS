using MediatR;
using Microsoft.EntityFrameworkCore;
using SoftPMS.Application.Common.Interfaces;
using SoftPMS.Domain.Enums;
using Microsoft.Extensions.Options;
using SoftPMS.Application.Common.Exceptions;
using SoftPMS.Application.Common.Settings;

namespace SoftPMS.Application.Features.Timesheets.Commands.UpdateTimesheetEntry;

public record UpdateTimesheetEntryCommand(
    Guid EntryId, 
    TimesheetStatus Status, 
    decimal OvertimeHours, 
    Guid? OvertimeTypeId,
    decimal WorkedHours,
    decimal PaidLeaveHours,
    decimal UnpaidLeaveHours
) : IRequest<bool>;

public class UpdateTimesheetEntryCommandHandler : IRequestHandler<UpdateTimesheetEntryCommand, bool>
{
    private readonly IApplicationDbContext _context;
    private readonly SoftPMS.Application.Common.Settings.SystemSettings _settings;

    public UpdateTimesheetEntryCommandHandler(IApplicationDbContext context, IOptions<SoftPMS.Application.Common.Settings.SystemSettings> options)
    {
        _context = context;
        _settings = options.Value;
    }

    public async Task<bool> Handle(UpdateTimesheetEntryCommand request, CancellationToken cancellationToken)
    {
        var entry = await _context.TimesheetEntries
            .Include(e => e.MonthlyTimesheet)
            .FirstOrDefaultAsync(e => e.Id == request.EntryId, cancellationToken);

        if (entry == null)
            throw new Exception("Timesheet entry not found");

        if (entry.Date.Year > _settings.GoLiveYear)
        {
            var isPrevYearClosed = await _context.YearlyRolloverLogs
                .AnyAsync(r => r.YearClosed == entry.Date.Year - 1, cancellationToken);
            
            if (!isPrevYearClosed)
            {
                throw new BusinessRuleException($"Cannot update timesheets for {entry.Date.Year} because the previous year ({entry.Date.Year - 1}) has not been closed yet.");
            }
        }

        if (request.Status == TimesheetStatus.PaidLeave)
        {
            // Check if ANY hourly compensation exists in this month for the employee
            var firstDayOfMonth = new DateTime(entry.Date.Year, entry.Date.Month, 1);
            var lastDayOfMonth = firstDayOfMonth.AddMonths(1).AddDays(-1);

            var hasHourlyInMonth = await _context.EmployeeCompensations
                .AnyAsync(c => c.EmployeeId == entry.MonthlyTimesheet.EmployeeId
                            && c.SalaryType == SalaryType.Hourly
                            && c.EffectiveDate <= lastDayOfMonth
                            && (c.EndDate == null || c.EndDate >= firstDayOfMonth), 
                            cancellationToken);

            if (hasHourlyInMonth)
            {
                throw new BusinessRuleException("Cannot set Paid Leave in a month that contains an Hourly compensation period.");
            }

            if (entry.Status != TimesheetStatus.PaidLeave)
            {
                var employee = await _context.Employees.FirstOrDefaultAsync(e => e.Id == entry.MonthlyTimesheet.EmployeeId, cancellationToken);
                if (employee != null)
                {
                    var usedLeavesThisYear = await _context.TimesheetEntries
                        .Where(t => t.MonthlyTimesheet.EmployeeId == employee.Id 
                                 && t.Date.Year == entry.Date.Year 
                                 && t.Status == TimesheetStatus.PaidLeave)
                        .CountAsync(cancellationToken);

                    if (employee.AnnualVacationDays + employee.CarriedOverLeaves - usedLeavesThisYear <= 0)
                    {
                        throw new BusinessRuleException("You do not have enough vacation balance left to take a Paid Leave.");
                    }
                }
            }
        }

        entry.Status = request.Status;
        entry.OvertimeHours = request.OvertimeHours;
        entry.OvertimeTypeId = request.OvertimeTypeId;
        entry.WorkedHours = request.WorkedHours;
        entry.PaidLeaveHours = request.PaidLeaveHours;
        entry.UnpaidLeaveHours = request.UnpaidLeaveHours;

        // Recalculate MonthlyTimesheet totals
        var timesheet = entry.MonthlyTimesheet;
        var allEntries = await _context.TimesheetEntries
            .Where(e => e.MonthlyTimesheetId == timesheet.Id)
            .ToListAsync(cancellationToken);

        // Replace the entry in memory with updated one
        var updatedEntryIndex = allEntries.FindIndex(e => e.Id == request.EntryId);
        if(updatedEntryIndex != -1) allEntries[updatedEntryIndex] = entry;

        timesheet.TotalWorkedDays = allEntries.Count(e => e.Status == TimesheetStatus.Worked);
        timesheet.TotalAbsentDays = allEntries.Count(e => e.Status == TimesheetStatus.Absent);
        timesheet.TotalOvertimeHours = allEntries.Sum(e => e.OvertimeHours);

        _context.TimesheetEntries.Update(entry);
        _context.MonthlyTimesheets.Update(timesheet);
        
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }
}
