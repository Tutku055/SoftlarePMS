using MediatR;
using Microsoft.EntityFrameworkCore;
using SoftPMS.Application.Common.Interfaces;
using SoftPMS.Domain.Enums;
using Microsoft.Extensions.Options;
using SoftPMS.Application.Common.Exceptions;

namespace SoftPMS.Application.Features.Timesheets.Commands.UpdateTimesheetEntry;

public sealed class UpdateTimesheetEntryCommandHandler(
    IApplicationDbContext context, 
    IOptions<SoftPMS.Application.Common.Settings.SystemSettings> options) : IRequestHandler<UpdateTimesheetEntryCommand, bool>
{
    public async Task<bool> Handle(UpdateTimesheetEntryCommand request, CancellationToken cancellationToken)
    {
        var entry = await context.TimesheetEntries
            .Include(e => e.MonthlyTimesheet)
            .FirstOrDefaultAsync(e => e.Id == request.EntryId, cancellationToken);

        if (entry == null)
            throw new Exception("Timesheet entry not found");

        if (entry.MonthlyTimesheet.IsLocked)
            throw new BusinessRuleException("Cannot update entries in a locked timesheet.");

        if (entry.Date.Year > options.Value.GoLiveYear)
        {
            var isPrevYearClosed = await context.YearlyRolloverLogs
                .AnyAsync(r => r.YearClosed == entry.Date.Year - 1, cancellationToken);
            
            if (!isPrevYearClosed)
            {
                throw new BusinessRuleException($"Cannot update timesheets for {entry.Date.Year} because the previous year ({entry.Date.Year - 1}) has not been closed yet.");
            }
        }

        if (request.Status == TimesheetStatus.PaidLeave)
        {
            // Hourly employees are not eligible for Paid Leave.
            var firstDayOfMonth = new DateTime(entry.Date.Year, entry.Date.Month, 1);
            var lastDayOfMonth = firstDayOfMonth.AddMonths(1).AddDays(-1);

            var activeCompensation = await context.EmployeeCompensations
                .FirstOrDefaultAsync(c => c.EmployeeId == entry.MonthlyTimesheet.EmployeeId
                            && c.EffectiveDate <= lastDayOfMonth
                            && (c.EndDate == null || c.EndDate >= firstDayOfMonth), 
                            cancellationToken);

            if (activeCompensation != null && activeCompensation.SalaryType == SalaryType.Hourly)
            {
                throw new BusinessRuleException("Cannot set Paid Leave in a month that has an Hourly compensation.");
            }

            if (entry.Status != TimesheetStatus.PaidLeave)
            {
                var employee = await context.Employees.FirstOrDefaultAsync(e => e.Id == entry.MonthlyTimesheet.EmployeeId, cancellationToken);
                if (employee != null)
                {
                    var usedLeavesThisYear = await context.TimesheetEntries
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

        if (request.OvertimeHours > 0)
        {
            if (!request.OvertimeTypeId.HasValue)
            {
                throw new BusinessRuleException("An Overtime Type must be selected if Overtime Hours are greater than 0.");
            }

            var typeExists = await context.OvertimeTypes.AnyAsync(t => t.Id == request.OvertimeTypeId.Value, cancellationToken);
            if (!typeExists)
            {
                throw new BusinessRuleException("The selected Overtime Type does not exist in the system.");
            }
        }
        else if (request.OvertimeTypeId.HasValue)
        {
            throw new BusinessRuleException("Overtime Type should not be set when there are no Overtime Hours.");
        }

        var overtime = request.OvertimeHours;
        var otTypeId = request.OvertimeTypeId;
        var paidLeave = request.PaidLeaveHours;
        var unpaidLeave = request.UnpaidLeaveHours;

        if (request.Status == TimesheetStatus.Absent || 
            request.Status == TimesheetStatus.PaidLeave || 
            request.Status == TimesheetStatus.UnpaidLeave || 
            request.Status == TimesheetStatus.Holiday)
        {
            overtime = 0;
            otTypeId = null;
            paidLeave = 0;
            unpaidLeave = 0;
        }

        entry.Status = request.Status;
        entry.OvertimeHours = overtime;
        entry.OvertimeTypeId = otTypeId;
        entry.WorkedHours = request.WorkedHours;
        entry.PaidLeaveHours = paidLeave;
        entry.UnpaidLeaveHours = unpaidLeave;

        // Recalculate MonthlyTimesheet totals
        var timesheet = entry.MonthlyTimesheet;
        var allEntries = await context.TimesheetEntries
            .Where(e => e.MonthlyTimesheetId == timesheet.Id)
            .ToListAsync(cancellationToken);

        // Replace the updated entry in the in-memory list before recalculating totals.
        var updatedEntryIndex = allEntries.FindIndex(e => e.Id == request.EntryId);
        if(updatedEntryIndex != -1) allEntries[updatedEntryIndex] = entry;

        timesheet.TotalWorkedDays = allEntries.Count(e => e.Status == TimesheetStatus.Worked);
        timesheet.TotalAbsentDays = allEntries.Count(e => e.Status == TimesheetStatus.Absent);
        timesheet.TotalOvertimeHours = allEntries.Sum(e => e.OvertimeHours);

        context.TimesheetEntries.Update(entry);
        context.MonthlyTimesheets.Update(timesheet);
        
        await context.SaveChangesAsync(cancellationToken);
        return true;
    }
}
