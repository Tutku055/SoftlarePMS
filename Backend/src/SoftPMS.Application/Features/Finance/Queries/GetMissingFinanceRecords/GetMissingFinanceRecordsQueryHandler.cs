using MediatR;
using Microsoft.EntityFrameworkCore;
using SoftPMS.Application.Common.Interfaces;
using SoftPMS.Application.Common.Models;
using SoftPMS.Application.Features.Finance.DTOs;
using SoftPMS.Domain.Enums;

namespace SoftPMS.Application.Features.Finance.Queries.GetMissingFinanceRecords;

public class GetMissingFinanceRecordsQueryHandler : IRequestHandler<GetMissingFinanceRecordsQuery, PaginatedList<MissingFinanceRecordDto>>
{
    private readonly IApplicationDbContext _context;

    public GetMissingFinanceRecordsQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<PaginatedList<MissingFinanceRecordDto>> Handle(
        GetMissingFinanceRecordsQuery request,
        CancellationToken cancellationToken)
    {
        var year = request.Year <= 0 ? DateTime.UtcNow.Year : request.Year;
        var month = request.Month < 1 || request.Month > 12 ? DateTime.UtcNow.Month : request.Month;
        var endOfMonth = new DateTime(year, month, DateTime.DaysInMonth(year, month));

        // 1. Fetch active employees employed on or before the end of the specified month
        var employeesQuery = _context.Employees
            .AsNoTracking()
            .Include(e => e.Department)
            .Include(e => e.Profession)
            .Where(e => !e.IsDeleted 
                     && e.EmploymentStatus == EmploymentStatus.Active
                     && e.HireDate.Date <= endOfMonth.Date
                     && (e.TerminationDate == null || e.TerminationDate.Value.Date >= new DateTime(year, month, 1)));

        if (!string.IsNullOrWhiteSpace(request.SearchTerm))
        {
            var search = request.SearchTerm.Trim().ToLower();
            employeesQuery = employeesQuery.Where(e =>
                e.FirstName.ToLower().Contains(search) ||
                e.LastName.ToLower().Contains(search) ||
                e.EmployeeNo.ToLower().Contains(search));
        }

        var employees = await employeesQuery
            .OrderBy(e => e.EmployeeNo)
            .ToListAsync(cancellationToken);

        if (employees.Count == 0)
        {
            return new PaginatedList<MissingFinanceRecordDto>(
                Array.Empty<MissingFinanceRecordDto>(), 0, request.PageNumber, request.PageSize);
        }

        var employeeIds = employees.Select(e => e.Id).ToList();

        // 2. Fetch existing timesheets and payrolls for the given period
        var existingTimesheetIds = await _context.MonthlyTimesheets
            .AsNoTracking()
            .Where(t => t.Year == year && t.Month == month && employeeIds.Contains(t.EmployeeId))
            .Select(t => t.EmployeeId)
            .ToHashSetAsync(cancellationToken);

        var existingPayrollIds = await _context.PayrollSlips
            .AsNoTracking()
            .Where(p => p.Year == year && p.Month == month && employeeIds.Contains(p.EmployeeId))
            .Select(p => p.EmployeeId)
            .ToHashSetAsync(cancellationToken);

        // 3. Evaluate missing status and filter by MissingType
        var missingRecords = new List<MissingFinanceRecordDto>();

        foreach (var emp in employees)
        {
            var hasTimesheet = existingTimesheetIds.Contains(emp.Id);
            var hasPayroll = existingPayrollIds.Contains(emp.Id);

            var isMissing = request.MissingType?.ToLowerInvariant() switch
            {
                "timesheet" => !hasTimesheet,
                "payroll"   => !hasPayroll,
                _           => !hasTimesheet || !hasPayroll // "Both" or default
            };

            if (isMissing)
            {
                missingRecords.Add(new MissingFinanceRecordDto
                {
                    EmployeeId = emp.Id,
                    EmployeeNo = emp.EmployeeNo,
                    FirstName = emp.FirstName,
                    LastName = emp.LastName,
                    FullName = $"{emp.FirstName} {emp.LastName}".Trim(),
                    DepartmentName = emp.Department?.Name,
                    ProfessionName = emp.Profession?.Name,
                    HasTimesheet = hasTimesheet,
                    HasPayroll = hasPayroll,
                    Year = year,
                    Month = month
                });
            }
        }

        // 4. Apply pagination
        var pageNumber = Math.Max(1, request.PageNumber);
        var pageSize = Math.Clamp(request.PageSize, 1, 100);
        var totalCount = missingRecords.Count;

        var pagedItems = missingRecords
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToList();

        return new PaginatedList<MissingFinanceRecordDto>(pagedItems, totalCount, pageNumber, pageSize);
    }
}
