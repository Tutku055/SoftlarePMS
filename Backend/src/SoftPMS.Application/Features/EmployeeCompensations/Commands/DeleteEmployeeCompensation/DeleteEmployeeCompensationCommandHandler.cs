using MediatR;
using Microsoft.EntityFrameworkCore;
using SoftPMS.Application.Common.Interfaces;
using SoftPMS.Application.Common.Exceptions;

namespace SoftPMS.Application.Features.EmployeeCompensations.Commands.DeleteEmployeeCompensation;

public sealed class DeleteEmployeeCompensationCommandHandler(
    IApplicationDbContext context) : IRequestHandler<DeleteEmployeeCompensationCommand, Unit>
{
    public async Task<Unit> Handle(DeleteEmployeeCompensationCommand request, CancellationToken cancellationToken)
    {
        var compensation = await context.EmployeeCompensations
            .FirstOrDefaultAsync(c => c.Id == request.Id, cancellationToken);

        if (compensation == null)
            throw new Exception("Compensation not found");

        var currentUtc = DateTime.UtcNow;
        var startOfCompensationMonth = new DateTime(compensation.EffectiveDate.Year, compensation.EffectiveDate.Month, 1);

        if (currentUtc >= startOfCompensationMonth)
        {
            throw new BusinessRuleException("Cannot delete a compensation for the current or a past month. Only future compensations can be deleted.");
        }

        // Find the predecessor that was closed to make way for this one
        var predecessor = await context.EmployeeCompensations
            .Where(c => c.EmployeeId == compensation.EmployeeId && c.EndDate == compensation.EffectiveDate.AddDays(-1))
            .FirstOrDefaultAsync(cancellationToken);

        context.EmployeeCompensations.Remove(compensation);

        if (predecessor != null)
        {
            // Revert the end date to cover the gap
            predecessor.EndDate = compensation.EndDate;
            context.EmployeeCompensations.Update(predecessor);
        }

        await context.SaveChangesAsync(cancellationToken);

        return Unit.Value;
    }
}
