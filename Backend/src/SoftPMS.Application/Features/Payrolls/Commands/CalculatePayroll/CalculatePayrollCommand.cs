using MediatR;
using Microsoft.EntityFrameworkCore;
using SoftPMS.Application.Common.Interfaces;
using SoftPMS.Domain.Entities;
using FluentValidation.Results;
using SoftPMS.Domain.Exceptions;

namespace SoftPMS.Application.Features.Payrolls.Commands.CalculatePayroll;

public record CalculatePayrollCommand(Guid EmployeeId, int Year, int Month) : IRequest<Guid>;

public class CalculatePayrollCommandHandler : IRequestHandler<CalculatePayrollCommand, Guid>
{
    private readonly IApplicationDbContext _context;
    private readonly ISender _sender;

    public CalculatePayrollCommandHandler(IApplicationDbContext context, ISender sender)
    {
        _context = context;
        _sender = sender;
    }

    public async Task<Guid> Handle(CalculatePayrollCommand request, CancellationToken cancellationToken)
    {
        var startOfMonthDate = new DateTime(request.Year, request.Month, 1);
        var endOfMonthDate = new DateTime(request.Year, request.Month, DateTime.DaysInMonth(request.Year, request.Month));

        var employee = await _context.Employees.FindAsync(new object[] { request.EmployeeId }, cancellationToken);
        if (employee == null)
            throw new NotFoundException(nameof(Employee), request.EmployeeId);

        var activeCompensation = await _context.EmployeeCompensations
            .FirstOrDefaultAsync(c => c.EmployeeId == request.EmployeeId
                        && c.EffectiveDate <= endOfMonthDate
                        && (c.EndDate == null || c.EndDate >= startOfMonthDate), 
                        cancellationToken);

        if (activeCompensation == null)
        {
            // Fallback for mid-month hires where compensation might be recorded as starting on the 1st of the next month.
            // If it's the employee's hire month, grab the earliest available compensation.
            if (employee.HireDate.Year == request.Year && employee.HireDate.Month == request.Month)
            {
                activeCompensation = await _context.EmployeeCompensations
                    .Where(c => c.EmployeeId == request.EmployeeId)
                    .OrderBy(c => c.EffectiveDate)
                    .FirstOrDefaultAsync(cancellationToken);
            }
        }

        if (activeCompensation == null)
        {
            throw new SoftPMS.Application.Common.Exceptions.ValidationException(new List<ValidationFailure> 
            { 
                new("Compensation", "No active compensation found for this employee in the selected month. Please ensure a compensation record exists before calculating payroll.") 
            });
        }

        // Dispatch to the appropriate salary calculator based on the active compensation type.
        if (activeCompensation.SalaryType == Domain.Enums.SalaryType.Monthly)
        {
            return await _sender.Send(new CalculateMonthlySalaryCommand(request.EmployeeId, request.Year, request.Month, activeCompensation.Id), cancellationToken);
        }
        else if (activeCompensation.SalaryType == Domain.Enums.SalaryType.Hourly)
        {
            return await _sender.Send(new CalculateHourlySalaryCommand(request.EmployeeId, request.Year, request.Month, activeCompensation.Id), cancellationToken);
        }

        throw new Exception("Unknown salary type.");
    }
}
