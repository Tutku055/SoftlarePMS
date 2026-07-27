using MediatR;
using Microsoft.EntityFrameworkCore;
using SoftPMS.Application.Common.Interfaces;
using SoftPMS.Domain.Entities;
using SoftPMS.Domain.Enums;

namespace SoftPMS.Application.Features.Timesheets.Commands.GenerateMonthlyTimesheet;

public record GenerateMonthlyTimesheetCommand(Guid EmployeeId, int Year, int Month) : IRequest<Guid>;

public class GenerateMonthlyTimesheetCommandHandler : IRequestHandler<GenerateMonthlyTimesheetCommand, Guid>
{
    private readonly IApplicationDbContext _context;

    public GenerateMonthlyTimesheetCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Guid> Handle(GenerateMonthlyTimesheetCommand request, CancellationToken cancellationToken)
    {
        var existingTimesheet = await _context.MonthlyTimesheets
            .FirstOrDefaultAsync(t => t.EmployeeId == request.EmployeeId && t.Year == request.Year && t.Month == request.Month, cancellationToken);
        
        if (existingTimesheet != null)
            throw new Exception("Timesheet already exists for this month.");

        var timesheet = new MonthlyTimesheet
        {
            EmployeeId = request.EmployeeId,
            Year = request.Year,
            Month = request.Month,
            TotalWorkedDays = 0,
            TotalOvertimeHours = 0,
            TotalAbsentDays = 0
        };

        int daysInMonth = DateTime.DaysInMonth(request.Year, request.Month);
        for (int i = 1; i <= daysInMonth; i++)
        {
            var date = new DateTime(request.Year, request.Month, i);
            var status = (date.DayOfWeek == DayOfWeek.Saturday || date.DayOfWeek == DayOfWeek.Sunday) 
                ? TimesheetStatus.Weekend 
                : TimesheetStatus.Worked;

            timesheet.Entries.Add(new TimesheetEntry
            {
                Date = date,
                Status = status,
                OvertimeHours = 0
            });
        }

        timesheet.TotalWorkedDays = timesheet.Entries.Count(e => e.Status == TimesheetStatus.Worked);

        _context.MonthlyTimesheets.Add(timesheet);
        await _context.SaveChangesAsync(cancellationToken);

        return timesheet.Id;
    }
}
