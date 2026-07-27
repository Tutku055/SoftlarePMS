using MediatR;
using Microsoft.EntityFrameworkCore;
using SoftPMS.Application.Common.Interfaces;
using SoftPMS.Application.DTOs.Payroll;

namespace SoftPMS.Application.Features.Payrolls.Queries.GetEmployeePayrollSlips;

public record GetEmployeePayrollSlipsQuery(Guid EmployeeId) : IRequest<List<PayrollSlipDto>>;

public class GetEmployeePayrollSlipsQueryHandler : IRequestHandler<GetEmployeePayrollSlipsQuery, List<PayrollSlipDto>>
{
    private readonly IApplicationDbContext _context;

    public GetEmployeePayrollSlipsQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<PayrollSlipDto>> Handle(GetEmployeePayrollSlipsQuery request, CancellationToken cancellationToken)
    {
        return await _context.PayrollSlips
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
                p.IssueDate))
            .ToListAsync(cancellationToken);
    }
}
