using MediatR;
using Microsoft.EntityFrameworkCore;
using SoftPMS.Application.Common.Interfaces;
using SoftPMS.Application.DTOs.Timesheet;

namespace SoftPMS.Application.Features.Timesheets.Queries.GetMonthlyTimesheet;

public record GetMonthlyTimesheetQuery(Guid EmployeeId, int Year, int Month) : IRequest<MonthlyTimesheetDto?>;

public class GetMonthlyTimesheetQueryHandler : IRequestHandler<GetMonthlyTimesheetQuery, MonthlyTimesheetDto?>
{
    private readonly IApplicationDbContext _context;

    public GetMonthlyTimesheetQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<MonthlyTimesheetDto?> Handle(GetMonthlyTimesheetQuery request, CancellationToken cancellationToken)
    {
        var timesheet = await _context.MonthlyTimesheets
            .Include(t => t.Entries)
            .FirstOrDefaultAsync(
                t => t.EmployeeId == request.EmployeeId && t.Year == request.Year && t.Month == request.Month,
                cancellationToken);

        if (timesheet == null)
            return null;

        var startOfMonth = new DateTime(request.Year, request.Month, 1);
        var endOfMonth = startOfMonth.AddMonths(1).AddDays(-1);

        var compensations = await _context.EmployeeCompensations
            .Where(c => c.EmployeeId == request.EmployeeId && c.EffectiveDate <= endOfMonth && (c.EndDate == null || c.EndDate >= startOfMonth))
            .OrderBy(c => c.EffectiveDate)
            .ToListAsync(cancellationToken);

        var entries = timesheet.Entries
            .OrderBy(e => e.Date)
            .Select(e => {
                var comp = compensations.LastOrDefault(c => c.EffectiveDate <= e.Date) 
                           ?? compensations.FirstOrDefault();
                
                var salaryType = comp?.SalaryType ?? Domain.Enums.SalaryType.Monthly;

                return new TimesheetEntryDto(
                    e.Id,
                    e.MonthlyTimesheetId,
                    e.Date,
                    (int)e.Status,
                    e.OvertimeHours,
                    e.OvertimeTypeId,
                    (int)salaryType,
                    e.WorkedHours,
                    e.PaidLeaveHours,
                    e.UnpaidLeaveHours);
            })
            .ToList();

        return new MonthlyTimesheetDto(
            timesheet.Id,
            timesheet.EmployeeId,
            timesheet.Year,
            timesheet.Month,
            timesheet.TotalWorkedDays,
            timesheet.TotalOvertimeHours,
            timesheet.TotalAbsentDays,
            entries);
    }
}
