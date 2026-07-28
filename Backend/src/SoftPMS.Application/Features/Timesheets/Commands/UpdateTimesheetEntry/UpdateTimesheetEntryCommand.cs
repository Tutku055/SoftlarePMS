using MediatR;
using Microsoft.EntityFrameworkCore;
using SoftPMS.Application.Common.Interfaces;
using SoftPMS.Domain.Enums;

namespace SoftPMS.Application.Features.Timesheets.Commands.UpdateTimesheetEntry;

public record UpdateTimesheetEntryCommand(Guid EntryId, TimesheetStatus Status, decimal OvertimeHours, Guid? OvertimeTypeId) : IRequest<bool>;

public class UpdateTimesheetEntryCommandHandler : IRequestHandler<UpdateTimesheetEntryCommand, bool>
{
    private readonly IApplicationDbContext _context;

    public UpdateTimesheetEntryCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<bool> Handle(UpdateTimesheetEntryCommand request, CancellationToken cancellationToken)
    {
        var entry = await _context.TimesheetEntries
            .Include(e => e.MonthlyTimesheet)
            .FirstOrDefaultAsync(e => e.Id == request.EntryId, cancellationToken);

        if (entry == null)
            throw new Exception("Timesheet entry not found");

        entry.Status = request.Status;
        entry.OvertimeHours = request.OvertimeHours;
        entry.OvertimeTypeId = request.OvertimeTypeId;

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
