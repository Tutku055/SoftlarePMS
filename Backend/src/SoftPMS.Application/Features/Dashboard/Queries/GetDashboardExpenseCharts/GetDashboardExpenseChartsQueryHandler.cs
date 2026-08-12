using MediatR;
using Microsoft.EntityFrameworkCore;
using SoftPMS.Application.Common.Interfaces;
using SoftPMS.Application.Features.Dashboard.DTOs;
using SoftPMS.Domain.Enums;

namespace SoftPMS.Application.Features.Dashboard.Queries.GetDashboardExpenseCharts;

public class GetDashboardExpenseChartsQueryHandler : IRequestHandler<GetDashboardExpenseChartsQuery, DashboardExpenseChartsDto>
{
    private readonly IApplicationDbContext _context;

    public GetDashboardExpenseChartsQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<DashboardExpenseChartsDto> Handle(GetDashboardExpenseChartsQuery request, CancellationToken cancellationToken)
    {
        var dto = new DashboardExpenseChartsDto();
        var now = DateTime.UtcNow;

        // Fetch active compensations with their employee and department info
        var compensations = await _context.EmployeeCompensations
            .Include(c => c.Employee)
            .ThenInclude(e => e.Department)
            .AsNoTracking()
            .Where(c => c.EffectiveDate <= now && (c.EndDate == null || c.EndDate >= now))
            .Where(c => !c.Employee.IsDeleted && c.Employee.EmploymentStatus == EmploymentStatus.Active)
            .ToListAsync(cancellationToken);

        // Process Monthly Expenses
        var monthlyComps = compensations.Where(c => c.SalaryType == SalaryType.Monthly);
        dto.MonthlyExpenses = GroupByDepartmentAndCurrency(monthlyComps);

        // Process Hourly Expenses
        var hourlyComps = compensations.Where(c => c.SalaryType == SalaryType.Hourly);
        dto.HourlyExpenses = GroupByDepartmentAndCurrency(hourlyComps);

        return dto;
    }

    private List<ExpenseDepartmentDto> GroupByDepartmentAndCurrency(IEnumerable<Domain.Entities.EmployeeCompensation> comps)
    {
        var result = new List<ExpenseDepartmentDto>();

        var byDept = comps.GroupBy(c => c.Employee.Department != null ? c.Employee.Department.Name : "Unassigned");

        foreach (var deptGroup in byDept)
        {
            var deptDto = new ExpenseDepartmentDto { DepartmentName = deptGroup.Key };

            var currencyStats = deptGroup
                .GroupBy(c => c.Currency.ToString())
                .Select(g => new { Currency = g.Key, Total = g.Sum(c => c.BaseSalary) })
                .OrderByDescending(x => x.Total)
                .ToList();

            var topCurrencies = currencyStats.Take(3).ToList();
            var otherCurrencies = currencyStats.Skip(3).ToList();

            foreach (var top in topCurrencies)
            {
                deptDto.ExpensesByCurrency.Add(top.Currency, top.Total);
            }

            if (otherCurrencies.Any())
            {
                deptDto.ExpensesByCurrency.Add("Other", otherCurrencies.Sum(x => x.Total));
            }

            result.Add(deptDto);
        }

        return result.OrderBy(r => r.DepartmentName).ToList();
    }
}
