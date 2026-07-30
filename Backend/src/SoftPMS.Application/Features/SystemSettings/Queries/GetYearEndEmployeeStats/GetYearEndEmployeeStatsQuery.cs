using MediatR;
using Microsoft.EntityFrameworkCore;
using SoftPMS.Application.Common.Interfaces;
using SoftPMS.Application.Features.SystemSettings.DTOs;
using SoftPMS.Domain.Enums;

namespace SoftPMS.Application.Features.SystemSettings.Queries.GetYearEndEmployeeStats;

public record GetYearEndEmployeeStatsQuery(int Year) : IRequest<YearEndStatsDto>;

public class GetYearEndEmployeeStatsQueryHandler : IRequestHandler<GetYearEndEmployeeStatsQuery, YearEndStatsDto>
{
    private readonly IApplicationDbContext _context;

    public GetYearEndEmployeeStatsQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<YearEndStatsDto> Handle(GetYearEndEmployeeStatsQuery request, CancellationToken cancellationToken)
    {
        var result = new YearEndStatsDto();

        // 1. Check if year is already closed
        var rolloverLog = await _context.YearlyRolloverLogs
            .FirstOrDefaultAsync(r => r.YearClosed == request.Year, cancellationToken);

        if (rolloverLog != null)
        {
            result.IsYearClosed = true;
            result.ClosedAt = rolloverLog.ClosedAt;
        }

        // 2. Fetch all active (non-deleted, non-terminated) employees
        //    with Department and Compensations eager-loaded (same pattern as GetEmployeeByIdQueryHandler).
        var allEmployees = await _context.Employees
            .Include(e => e.Department)
            .Include(e => e.Compensations)
            .Where(e => !e.IsDeleted && e.EmploymentStatus != EmploymentStatus.Terminated)
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        // 3. Filter in-memory: only employees who have a Monthly compensation record
        //    whose EffectiveDate is on or before the target year, and whose EndDate is null
        //    or in/after the target year, and who were hired on or before the target year.
        var monthlyEmployees = allEmployees
            .Where(e => e.HireDate.Year <= request.Year
                     && e.Compensations.Any(c =>
                            c.SalaryType == SalaryType.Monthly
                         && c.EffectiveDate.Year <= request.Year
                         && (c.EndDate == null || c.EndDate.Value.Year >= request.Year)))
            .ToList();

        // 4. Get timesheet counts per employee for the target year
        var employeeIds = monthlyEmployees.Select(e => e.Id).ToList();

        var timesheetsCounts = await _context.MonthlyTimesheets
            .Where(t => t.Year == request.Year && employeeIds.Contains(t.EmployeeId))
            .GroupBy(t => t.EmployeeId)
            .Select(g => new { EmployeeId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.EmployeeId, x => x.Count, cancellationToken);

        // 5. Build per-employee stats
        foreach (var emp in monthlyEmployees)
        {
            // Mid-year hire: if the employee was hired in the target year,
            // only count from hire month through December.
            // e.g. HireDate = Sep 2026 → expected = 12 - 9 + 1 = 4 months (Sep,Oct,Nov,Dec)
            var expectedTimesheets = emp.HireDate.Year == request.Year
                ? (12 - emp.HireDate.Month + 1)
                : 12;

            var timesheetsCount = timesheetsCounts.TryGetValue(emp.Id, out var tc) ? tc : 0;
            var missingCount = Math.Max(0, expectedTimesheets - timesheetsCount);

            result.Employees.Add(new YearEndEmployeeStatDto
            {
                EmployeeId = emp.Id,
                FullName = $"{emp.FirstName} {emp.LastName}",
                DepartmentName = emp.Department?.Name ?? "No Department",
                ExpectedTimesheets = expectedTimesheets,
                TimesheetsCount = timesheetsCount,
                MissingTimesheetsCount = missingCount,
                IsLeaveEligible = true
            });
        }

        result.TotalAffectedEmployees = result.Employees.Count;
        result.TotalMissingTimesheets = result.Employees.Sum(e => e.MissingTimesheetsCount);

        return result;
    }
}
