using MediatR;
using Microsoft.EntityFrameworkCore;
using SoftPMS.Application.Common.Interfaces;
using SoftPMS.Domain.Entities;
using SoftPMS.Domain.Enums;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Options;
using SoftPMS.Application.Common.Exceptions;
using SoftPMS.Application.Common.Settings;
using SoftPMS.Domain.Exceptions;

namespace SoftPMS.Application.Features.Timesheets.Commands.GenerateMonthlyTimesheet;

public record GenerateMonthlyTimesheetCommand(Guid EmployeeId, int Year, int Month) : IRequest<Guid>;

public class GenerateMonthlyTimesheetCommandHandler : IRequestHandler<GenerateMonthlyTimesheetCommand, Guid>
{
    private readonly IApplicationDbContext _context;
    private readonly IConfiguration _configuration;
    private readonly SoftPMS.Application.Common.Settings.SystemSettings _settings;

    public GenerateMonthlyTimesheetCommandHandler(IApplicationDbContext context, IConfiguration configuration, IOptions<SoftPMS.Application.Common.Settings.SystemSettings> options)
    {
        _context = context;
        _configuration = configuration;
        _settings = options.Value;
    }

    public async Task<Guid> Handle(GenerateMonthlyTimesheetCommand request, CancellationToken cancellationToken)
    {
        var employee = await _context.Employees
            .FirstOrDefaultAsync(e => e.Id == request.EmployeeId, cancellationToken)
            ?? throw new NotFoundException(nameof(Employee), request.EmployeeId);

        var existingTimesheet = await _context.MonthlyTimesheets
            .FirstOrDefaultAsync(t => t.EmployeeId == request.EmployeeId && t.Year == request.Year && t.Month == request.Month, cancellationToken);
        
        if (existingTimesheet != null)
            throw new Exception("Timesheet already exists for this month.");

        var timesheetPeriod = new DateTime(request.Year, request.Month, 1, 0, 0, 0, DateTimeKind.Unspecified);
        var hireMonth = new DateTime(employee.HireDate.Year, employee.HireDate.Month, 1, 0, 0, 0, DateTimeKind.Unspecified);
        
        if (timesheetPeriod < hireMonth)
        {
            throw new BusinessRuleException("Cannot generate timesheets for months before the employee's hire date.");
        }

        if (request.Year > _settings.GoLiveYear)
        {
            var isPrevYearClosed = await _context.YearlyRolloverLogs
                .AnyAsync(r => r.YearClosed == request.Year - 1, cancellationToken);
            
            if (!isPrevYearClosed)
            {
                throw new BusinessRuleException($"Cannot generate timesheets for {request.Year} because the previous year ({request.Year - 1}) has not been closed yet.");
            }
        }

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
        decimal dailyWorkingHours = 8m;
        var configValue = _configuration["PayrollSettings:DailyWorkingHours"];
        if (!string.IsNullOrEmpty(configValue) && decimal.TryParse(configValue, System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out var parsed))
        {
            dailyWorkingHours = parsed;
        }

        for (int i = 1; i <= daysInMonth; i++)
        {
            var date = new DateTime(request.Year, request.Month, i);
            
            // Skip days before the hire date in the hire month
            if (date < employee.HireDate.Date)
            {
                continue;
            }

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
        await _context.SaveChangesAsync(cancellationToken);

        return timesheet.Id;
    }
}
