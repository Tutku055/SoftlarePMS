using MediatR;
using Microsoft.EntityFrameworkCore;
using SoftPMS.Application.Common.Interfaces;
using SoftPMS.Application.Features.Timesheets.DTOs;

using SoftPMS.Application.Features.Timesheets.Queries.GetMonthlyTimesheet;
using Microsoft.Extensions.Options;
using SoftPMS.Application.Common.Settings;

namespace SoftPMS.Application.Features.Timesheets.Queries.GetMonthlyTimesheet;

public record GetMonthlyTimesheetQuery(Guid EmployeeId, int Year, int Month) : IRequest<MonthlyTimesheetDto?>;

public class GetMonthlyTimesheetQueryHandler : IRequestHandler<GetMonthlyTimesheetQuery, MonthlyTimesheetDto?>
{
    private readonly IApplicationDbContext _context;
    private readonly SoftPMS.Application.Common.Settings.SystemSettings _settings;

    public GetMonthlyTimesheetQueryHandler(IApplicationDbContext context, IOptions<SoftPMS.Application.Common.Settings.SystemSettings> options)
    {
        _context = context;
        _settings = options.Value;
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

        // Resolve each entry's salary type from the compensation active on that specific date.
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

        bool isPreviousYearPendingClosure = false;
        if (request.Year > _settings.GoLiveYear)
        {
            var isPrevYearClosed = await _context.YearlyRolloverLogs
                .AnyAsync(r => r.YearClosed == request.Year - 1, cancellationToken);
            isPreviousYearPendingClosure = !isPrevYearClosed;
        }

        return new MonthlyTimesheetDto(
            timesheet.Id,
            timesheet.EmployeeId,
            timesheet.Year,
            timesheet.Month,
            timesheet.TotalWorkedDays,
            timesheet.TotalOvertimeHours,
            timesheet.TotalAbsentDays,
            entries,
            timesheet.IsLocked,
            isPreviousYearPendingClosure);
    }
}
