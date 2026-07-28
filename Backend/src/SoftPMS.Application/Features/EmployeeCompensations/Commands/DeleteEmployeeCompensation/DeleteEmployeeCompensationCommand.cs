using MediatR;
using Microsoft.EntityFrameworkCore;
using SoftPMS.Application.Common.Interfaces;

namespace SoftPMS.Application.Features.EmployeeCompensations.Commands.DeleteEmployeeCompensation;

public record DeleteEmployeeCompensationCommand(Guid Id) : IRequest<Unit>;

public class DeleteEmployeeCompensationCommandHandler : IRequestHandler<DeleteEmployeeCompensationCommand, Unit>
{
    private readonly IApplicationDbContext _context;

    public DeleteEmployeeCompensationCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Unit> Handle(DeleteEmployeeCompensationCommand request, CancellationToken cancellationToken)
    {
        var compensation = await _context.EmployeeCompensations
            .FirstOrDefaultAsync(c => c.Id == request.Id, cancellationToken);

        if (compensation == null)
            throw new Exception("Compensation not found");

        // Find the predecessor that was closed to make way for this one
        var predecessor = await _context.EmployeeCompensations
            .Where(c => c.EmployeeId == compensation.EmployeeId && c.EndDate == compensation.EffectiveDate.AddDays(-1))
            .FirstOrDefaultAsync(cancellationToken);

        _context.EmployeeCompensations.Remove(compensation);

        if (predecessor != null)
        {
            // Revert the end date to cover the gap
            predecessor.EndDate = compensation.EndDate;
            _context.EmployeeCompensations.Update(predecessor);
        }

        await _context.SaveChangesAsync(cancellationToken);

        return Unit.Value;
    }
}
