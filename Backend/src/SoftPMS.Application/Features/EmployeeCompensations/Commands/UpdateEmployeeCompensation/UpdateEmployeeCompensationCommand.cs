using MediatR;
using Microsoft.EntityFrameworkCore;
using SoftPMS.Application.Common.Interfaces;
using SoftPMS.Domain.Entities;
using SoftPMS.Domain.Enums;

namespace SoftPMS.Application.Features.EmployeeCompensations.Commands.UpdateEmployeeCompensation;

public record UpdateEmployeeCompensationCommand(
    Guid EmployeeId,
    decimal BaseSalary,
    SalaryType SalaryType,
    Currency Currency,
    DateTime EffectiveDate
) : IRequest<Guid>;

public class UpdateEmployeeCompensationCommandHandler : IRequestHandler<UpdateEmployeeCompensationCommand, Guid>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public UpdateEmployeeCompensationCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<Guid> Handle(UpdateEmployeeCompensationCommand request, CancellationToken cancellationToken)
    {
        var employee = await _context.Employees.FindAsync(new object[] { request.EmployeeId }, cancellationToken);
        if (employee == null)
            throw new Exception("Employee not found");

        var activeCompensation = await _context.EmployeeCompensations
            .Where(c => c.EmployeeId == request.EmployeeId && c.EndDate == null)
            .FirstOrDefaultAsync(cancellationToken);

        if (activeCompensation != null)
        {
            if (request.EffectiveDate.Date <= activeCompensation.EffectiveDate.Date)
            {
                throw new Exception("New compensation's effective date must be later than the current active compensation's effective date.");
            }
            activeCompensation.EndDate = request.EffectiveDate.AddDays(-1);
            _context.EmployeeCompensations.Update(activeCompensation);
        }

        var newCompensation = new EmployeeCompensation
        {
            EmployeeId       = request.EmployeeId,
            BaseSalary       = request.BaseSalary,
            SalaryType       = request.SalaryType,
            Currency         = request.Currency,
            EffectiveDate    = request.EffectiveDate,
            EndDate          = null,
            CreatedByUserId  = _currentUser.UserId
        };

        _context.EmployeeCompensations.Add(newCompensation);
        await _context.SaveChangesAsync(cancellationToken);

        return newCompensation.Id;
    }
}
