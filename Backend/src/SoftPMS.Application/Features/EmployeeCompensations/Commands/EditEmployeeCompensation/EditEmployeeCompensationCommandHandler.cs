using MediatR;
using Microsoft.EntityFrameworkCore;
using SoftPMS.Application.Common.Interfaces;
using SoftPMS.Application.Common.Exceptions;

namespace SoftPMS.Application.Features.EmployeeCompensations.Commands.EditEmployeeCompensation;

public sealed class EditEmployeeCompensationCommandHandler(
    IApplicationDbContext context) : IRequestHandler<EditEmployeeCompensationCommand, Unit>
{
    public async Task<Unit> Handle(EditEmployeeCompensationCommand request, CancellationToken cancellationToken)
    {
        var compensation = await context.EmployeeCompensations
            .FirstOrDefaultAsync(c => c.Id == request.Id && c.EmployeeId == request.EmployeeId, cancellationToken);

        if (compensation == null)
            throw new Exception("Compensation record not found");

        var currentUtc = DateTime.UtcNow;
        var endOfCompensationMonth = new DateTime(compensation.EffectiveDate.Year, compensation.EffectiveDate.Month, 
            DateTime.DaysInMonth(compensation.EffectiveDate.Year, compensation.EffectiveDate.Month)).AddDays(1).AddTicks(-1);

        if (currentUtc > endOfCompensationMonth)
        {
            throw new BusinessRuleException("Cannot edit a compensation from a past month. Past compensations are immutable.");
        }

        var activeCompensation = await context.EmployeeCompensations
            .Where(c => c.EmployeeId == request.EmployeeId && c.EndDate == null && c.Id != request.Id)
            .FirstOrDefaultAsync(cancellationToken);

        if (activeCompensation != null && activeCompensation.EffectiveDate.Date >= request.EffectiveDate.Date)
        {
            throw new BusinessRuleException("Edited compensation's effective date cannot be earlier than or equal to the current active compensation's effective date unless editing the active one.");
        }

        compensation.BaseSalary = request.BaseSalary;
        compensation.SalaryType = request.SalaryType;
        compensation.Currency = request.Currency;
        compensation.EffectiveDate = request.EffectiveDate;

        context.EmployeeCompensations.Update(compensation);
        await context.SaveChangesAsync(cancellationToken);

        return Unit.Value;
    }
}
