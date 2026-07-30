using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using SoftPMS.Application.Common.Interfaces;
using SoftPMS.Application.Features.Employees.DTOs;
using SoftPMS.Domain.Exceptions;

namespace SoftPMS.Application.Features.Employees.Queries.GetEmployeeById;

/// <summary>
/// Fetches a single employee with all related collections in one optimised query.
/// Uses split queries (separate SQL per Include) to avoid cartesian explosion across five collections.
/// </summary>
public sealed class GetEmployeeByIdQueryHandler(
    IApplicationDbContext context,
    IMapper mapper)
    : IRequestHandler<GetEmployeeByIdQuery, EmployeeDetailDto>
{
    public async Task<EmployeeDetailDto> Handle(GetEmployeeByIdQuery request, CancellationToken cancellationToken)
    {
        var employee = await context.Employees
            .Include(e => e.Department)
            .Include(e => e.Profession)
            .Include(e => e.Addresses)
            .Include(e => e.Compensations)

            .Include(e => e.Notes)
            .Include(e => e.References)
            .FirstOrDefaultAsync(e => e.Id == request.EmployeeId, cancellationToken)
            ?? throw new NotFoundException(nameof(Domain.Entities.Employee), request.EmployeeId);

        var dto = mapper.Map<EmployeeDetailDto>(employee);
        
        var currentYear = DateTime.UtcNow.Year;
        // The used leave days is the count of TimesheetEntries where status is PaidLeave (3) for the current year
        // We need to query this from the database
        var usedLeavesThisYear = await context.TimesheetEntries
            .Where(t => t.MonthlyTimesheet.EmployeeId == request.EmployeeId 
                     && t.Date.Year == currentYear 
                     && t.Status == Domain.Enums.TimesheetStatus.PaidLeave)
            .CountAsync(cancellationToken);
            
        dto.UsedLeaveDaysThisYear = usedLeavesThisYear;

        return dto;
    }
}
