using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Options;
using SoftPMS.Application.Common.Exceptions;
using SoftPMS.Application.Common.Interfaces;
using SoftPMS.Application.Features.Timesheets.DTOs;
using SoftPMS.Domain.Entities;
using SoftPMS.Domain.Enums;

namespace SoftPMS.Application.Features.Timesheets.Commands.BulkTimesheetOperation;

public record BulkTimesheetOperationCommand(
    BulkTimesheetAction Action,
    BulkTimesheetScope Scope,
    BulkTimesheetPeriodType PeriodType,
    int Year,
    int Month,
    int? Day,
    DateTime? StartDate,
    DateTime? EndDate,
    Guid? DepartmentId,
    List<Guid>? EmployeeIds,
    TimesheetStatus? Status,
    decimal? OvertimeHours,
    Guid? OvertimeTypeId,
    decimal? PaidLeaveHours,
    decimal? UnpaidLeaveHours
) : IRequest<BulkOperationResultDto>;

public class BulkTimesheetOperationCommandHandler : IRequestHandler<BulkTimesheetOperationCommand, BulkOperationResultDto>
{
    private readonly IApplicationDbContext _context;
    private readonly IConfiguration _configuration;
    private readonly SoftPMS.Application.Common.Settings.SystemSettings _settings;

    public BulkTimesheetOperationCommandHandler(
        IApplicationDbContext context,
        IConfiguration configuration,
        IOptions<SoftPMS.Application.Common.Settings.SystemSettings> options)
    {
        _context = context;
        _configuration = configuration;
        _settings = options.Value;
    }

    public async Task<BulkOperationResultDto> Handle(BulkTimesheetOperationCommand request, CancellationToken cancellationToken)
    {
        // ── 1. Resolve target employees ──────────────────────────────────
        var employeesQuery = _context.Employees.AsQueryable();

        switch (request.Scope)
        {
            case BulkTimesheetScope.AllActive:
                employeesQuery = employeesQuery.Where(e => e.EmploymentStatus == EmploymentStatus.Active);
                break;
            case BulkTimesheetScope.Department:
                employeesQuery = employeesQuery.Where(e =>
                    e.EmploymentStatus == EmploymentStatus.Active &&
                    e.DepartmentId == request.DepartmentId!.Value);
                break;
            case BulkTimesheetScope.Selected:
                employeesQuery = employeesQuery.Where(e => request.EmployeeIds!.Contains(e.Id));
                break;
        }

        var employees = await employeesQuery
            .Select(e => new EmployeeSlim { Id = e.Id, FirstName = e.FirstName, LastName = e.LastName, HireDate = e.HireDate })
            .ToListAsync(cancellationToken);

        if (employees.Count == 0)
            throw new BusinessRuleException("No employees found for the selected scope.");

        int processed = 0;
        int skipped = 0;
        var skippedReasons = new Dictionary<string, List<string>>();

        void AddSkipped(string reason, string employeeName)
        {
            skipped++;
            if (!skippedReasons.ContainsKey(reason))
                skippedReasons[reason] = new List<string>();
            skippedReasons[reason].Add(employeeName);
        }

        await using var transaction = await _context.BeginTransactionAsync(cancellationToken);

        try
        {
            switch (request.Action)
            {
                case BulkTimesheetAction.GenerateTimesheet:
                    processed = await HandleGenerateTimesheet(request, employees, AddSkipped, cancellationToken);
                    break;
                case BulkTimesheetAction.ApplyStatus:
                case BulkTimesheetAction.ApplyOvertime:
                case BulkTimesheetAction.ApplyLeaveHours:
                    processed = await HandleDailyOperations(request, employees, AddSkipped, cancellationToken);
                    break;
                case BulkTimesheetAction.Lock:
                case BulkTimesheetAction.Unlock:
                    processed = await HandleManageLock(request, employees, AddSkipped, cancellationToken);
                    break;
            }

            await _context.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
        }
        catch
        {
            await transaction.RollbackAsync(cancellationToken);
            throw;
        }

        return new BulkOperationResultDto(processed, skipped, skippedReasons);
    }

    private async Task<int> HandleGenerateTimesheet(
        BulkTimesheetOperationCommand request,
        List<EmployeeSlim> employees,
        Action<string, string> addSkipped,
        CancellationToken cancellationToken)
    {
        int processed = 0;
        var employeeIds = employees.Select(e => e.Id).ToList();

        var existingTimesheets = await _context.MonthlyTimesheets
            .Where(t => employeeIds.Contains(t.EmployeeId) && t.Year == request.Year && t.Month == request.Month)
            .Select(t => t.EmployeeId)
            .ToHashSetAsync(cancellationToken);

        // Check year-end closure
        if (request.Year > _settings.GoLiveYear)
        {
            var isPrevYearClosed = await _context.YearlyRolloverLogs
                .AnyAsync(r => r.YearClosed == request.Year - 1, cancellationToken);
            if (!isPrevYearClosed)
                throw new BusinessRuleException($"Cannot generate timesheets for {request.Year} because the previous year ({request.Year - 1}) has not been closed yet.");
        }

        decimal dailyWorkingHours = 8m;
        var configValue = _configuration["PayrollSettings:DailyWorkingHours"];
        if (!string.IsNullOrEmpty(configValue) && decimal.TryParse(configValue, System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out var parsed))
            dailyWorkingHours = parsed;

        int daysInMonth = DateTime.DaysInMonth(request.Year, request.Month);

        foreach (var emp in employees)
        {
            string fullName = $"{emp.FirstName} {emp.LastName}";

            if (existingTimesheets.Contains(emp.Id))
            {
                addSkipped("Timesheet already exists", fullName);
                continue;
            }

            var timesheetPeriod = new DateTime(request.Year, request.Month, 1, 0, 0, 0, DateTimeKind.Unspecified);
            var hireMonth = new DateTime(emp.HireDate.Year, emp.HireDate.Month, 1, 0, 0, 0, DateTimeKind.Unspecified);

            if (timesheetPeriod < hireMonth)
            {
                addSkipped("Before hire date", fullName);
                continue;
            }

            var timesheet = new MonthlyTimesheet
            {
                EmployeeId = emp.Id,
                Year = request.Year,
                Month = request.Month,
                TotalWorkedDays = 0,
                TotalOvertimeHours = 0,
                TotalAbsentDays = 0
            };

            for (int i = 1; i <= daysInMonth; i++)
            {
                var date = new DateTime(request.Year, request.Month, i);
                if (date < emp.HireDate.Date) continue;

                var status = (date.DayOfWeek == DayOfWeek.Saturday || date.DayOfWeek == DayOfWeek.Sunday)
                    ? TimesheetStatus.Weekend
                    : TimesheetStatus.Worked;

                timesheet.Entries.Add(new TimesheetEntry
                {
                    Date = date,
                    Status = status,
                    OvertimeHours = 0,
                    WorkedHours = status == TimesheetStatus.Worked ? dailyWorkingHours : 0m
                });
            }

            timesheet.TotalWorkedDays = timesheet.Entries.Count(e => e.Status == TimesheetStatus.Worked);
            _context.MonthlyTimesheets.Add(timesheet);
            processed++;
        }

        return processed;
    }

    private async Task<int> HandleDailyOperations(
        BulkTimesheetOperationCommand request,
        List<EmployeeSlim> employees,
        Action<string, string> addSkipped,
        CancellationToken cancellationToken)
    {
        int processed = 0;
        var employeeIds = employees.Select(e => e.Id).ToList();

        // Resolve target dates
        var targetDates = new List<DateTime>();
        if (request.PeriodType == BulkTimesheetPeriodType.Day)
        {
            targetDates.Add(new DateTime(request.Year, request.Month, request.Day!.Value));
        }
        else if (request.PeriodType == BulkTimesheetPeriodType.DayInterval)
        {
            for (var d = request.StartDate!.Value.Date; d <= request.EndDate!.Value.Date; d = d.AddDays(1))
                targetDates.Add(d);
        }

        if (targetDates.Count == 0) return 0;

        // Group dates by Year and Month
        var targetMonths = targetDates
            .GroupBy(d => new { d.Year, d.Month })
            .ToList();

        // For PaidLeave, load compensations
        Dictionary<Guid, SalaryType>? compensationMap = null;
        if (request.Action == BulkTimesheetAction.ApplyStatus && request.Status == TimesheetStatus.PaidLeave)
        {
            var minDate = targetDates.Min();
            var maxDate = targetDates.Max();

            var compensations = await _context.EmployeeCompensations
                .Where(c => employeeIds.Contains(c.EmployeeId)
                    && c.EffectiveDate <= maxDate
                    && (c.EndDate == null || c.EndDate >= minDate))
                .ToListAsync(cancellationToken);

            compensationMap = new Dictionary<Guid, SalaryType>();
            foreach (var empId in employeeIds)
            {
                var comp = compensations
                    .Where(c => c.EmployeeId == empId)
                    .OrderByDescending(c => c.EffectiveDate)
                    .FirstOrDefault();
                if (comp != null)
                    compensationMap[empId] = comp.SalaryType;
            }
        }

        foreach (var monthGroup in targetMonths)
        {
            var year = monthGroup.Key.Year;
            var month = monthGroup.Key.Month;
            var datesInMonth = monthGroup.ToList();

            var timesheets = await _context.MonthlyTimesheets
                .Include(t => t.Entries)
                .Where(t => employeeIds.Contains(t.EmployeeId) && t.Year == year && t.Month == month)
                .ToListAsync(cancellationToken);

            var timesheetMap = timesheets.ToDictionary(t => t.EmployeeId);

            foreach (var emp in employees)
            {
                string fullName = $"{emp.FirstName} {emp.LastName}";

                if (!timesheetMap.TryGetValue(emp.Id, out var timesheet))
                {
                    addSkipped($"No timesheet for {year}-{month:D2}", fullName);
                    continue;
                }

                if (timesheet.IsLocked)
                {
                    addSkipped($"Timesheet is locked for {year}-{month:D2}", fullName);
                    continue;
                }

                // PaidLeave restriction: skip hourly employees
                if (request.Action == BulkTimesheetAction.ApplyStatus && request.Status == TimesheetStatus.PaidLeave && compensationMap != null)
                {
                    if (compensationMap.TryGetValue(emp.Id, out var salaryType) && salaryType == SalaryType.Hourly)
                    {
                        addSkipped("Hourly employee (Paid Leave not applicable)", fullName);
                        continue;
                    }
                }

                // Apply operations to matching entries
                var matchingEntries = timesheet.Entries
                    .Where(e => datesInMonth.Any(d => e.Date.Date == d.Date))
                    .ToList();

                if (matchingEntries.Count == 0)
                {
                    addSkipped($"No matching entries for {year}-{month:D2}", fullName);
                    continue;
                }

                foreach (var entry in matchingEntries)
                {
                    if (request.Action == BulkTimesheetAction.ApplyStatus)
                    {
                        entry.Status = request.Status!.Value;
                        if (request.Status.Value != TimesheetStatus.Worked)
                        {
                            entry.OvertimeHours = 0;
                            entry.OvertimeTypeId = null;
                        }
                    }
                    else if (request.Action == BulkTimesheetAction.ApplyOvertime)
                    {
                        if (entry.Status == TimesheetStatus.Worked || entry.Status == TimesheetStatus.Weekend || entry.Status == TimesheetStatus.Holiday)
                        {
                            entry.OvertimeHours = request.OvertimeHours!.Value;
                            entry.OvertimeTypeId = request.OvertimeTypeId;
                        }
                        else
                        {
                            addSkipped($"Cannot apply overtime to {entry.Status} status ({entry.Date:yyyy-MM-dd})", fullName);
                        }
                    }
                    else if (request.Action == BulkTimesheetAction.ApplyLeaveHours)
                    {
                        if (request.PaidLeaveHours.HasValue && request.PaidLeaveHours.Value > 0)
                        {
                            entry.PaidLeaveHours = request.PaidLeaveHours.Value;
                        }
                        if (request.UnpaidLeaveHours.HasValue && request.UnpaidLeaveHours.Value > 0)
                        {
                            entry.UnpaidLeaveHours = request.UnpaidLeaveHours.Value;
                        }
                    }
                }

                // Recalculate totals
                timesheet.TotalWorkedDays = timesheet.Entries.Count(e => e.Status == TimesheetStatus.Worked);
                timesheet.TotalAbsentDays = timesheet.Entries.Count(e => e.Status == TimesheetStatus.Absent);
                timesheet.TotalOvertimeHours = timesheet.Entries.Sum(e => e.OvertimeHours);

                _context.MonthlyTimesheets.Update(timesheet);
                processed++;
            }
        }

        return processed;
    }

    private async Task<int> HandleManageLock(
        BulkTimesheetOperationCommand request,
        List<EmployeeSlim> employees,
        Action<string, string> addSkipped,
        CancellationToken cancellationToken)
    {
        int processed = 0;
        var employeeIds = employees.Select(e => e.Id).ToList();
        bool lockValue = request.Action == BulkTimesheetAction.Lock;

        var timesheets = await _context.MonthlyTimesheets
            .Where(t => employeeIds.Contains(t.EmployeeId) && t.Year == request.Year && t.Month == request.Month)
            .ToListAsync(cancellationToken);

        var timesheetMap = timesheets.ToDictionary(t => t.EmployeeId);

        foreach (var emp in employees)
        {
            string fullName = $"{emp.FirstName} {emp.LastName}";

            if (!timesheetMap.TryGetValue(emp.Id, out var timesheet))
            {
                addSkipped("No timesheet for this month", fullName);
                continue;
            }

            if (timesheet.IsLocked == lockValue)
            {
                addSkipped(lockValue ? "Already locked" : "Already unlocked", fullName);
                continue;
            }

            timesheet.IsLocked = lockValue;
            _context.MonthlyTimesheets.Update(timesheet);
            processed++;
        }

        return processed;
    }

    /// <summary>Lightweight projection to avoid using dynamic types.</summary>
    private class EmployeeSlim
    {
        public Guid Id { get; set; }
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public DateTime HireDate { get; set; }
    }
}
