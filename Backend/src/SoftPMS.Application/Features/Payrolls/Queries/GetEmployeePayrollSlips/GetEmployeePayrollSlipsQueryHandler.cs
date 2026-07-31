using MediatR;
using Microsoft.EntityFrameworkCore;
using SoftPMS.Application.Common.Interfaces;
using SoftPMS.Application.Features.Payrolls.DTOs;

namespace SoftPMS.Application.Features.Payrolls.Queries.GetEmployeePayrollSlips;

public sealed class GetEmployeePayrollSlipsQueryHandler(
    IApplicationDbContext context) : IRequestHandler<GetEmployeePayrollSlipsQuery, List<PayrollSlipDto>>
{
    public async Task<List<PayrollSlipDto>> Handle(GetEmployeePayrollSlipsQuery request, CancellationToken cancellationToken)
    {
        return await context.PayrollSlips
            .Include(p => p.LineItems)
            .Where(p => p.EmployeeId == request.EmployeeId)
            .OrderByDescending(p => p.Year)
            .ThenByDescending(p => p.Month)
            .Select(p => new PayrollSlipDto(
                p.Id,
                p.EmployeeId,
                p.Year,
                p.Month,
                p.BaseSalary,
                p.TotalEarnings,
                p.TotalDeductions,
                p.NetSalary,
                p.SalaryTypes,
                p.IssueDate,
                p.LineItems.Select(li => new PayrollSlipLineItemDto(li.Id, (int)li.ItemType, li.Description, li.Amount, (int)li.Currency)).ToList()))
            .ToListAsync(cancellationToken);
    }
}
