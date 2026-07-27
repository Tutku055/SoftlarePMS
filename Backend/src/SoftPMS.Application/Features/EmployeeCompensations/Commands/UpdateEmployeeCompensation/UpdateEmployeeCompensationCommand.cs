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
            .FirstOrDefaultAsync(c => c.EmployeeId == request.EmployeeId, cancellationToken);

        if (activeCompensation != null)
        {
            activeCompensation.BaseSalary = request.BaseSalary;
            activeCompensation.SalaryType = request.SalaryType;
            activeCompensation.Currency = request.Currency;
            activeCompensation.EffectiveDate = request.EffectiveDate;
            
            _context.EmployeeCompensations.Update(activeCompensation);
            await _context.SaveChangesAsync(cancellationToken);
            return activeCompensation.Id;
        }

        var newCompensation = new EmployeeCompensation
        {
            EmployeeId       = request.EmployeeId,
            BaseSalary       = request.BaseSalary,
            SalaryType       = request.SalaryType,
            Currency         = request.Currency,
            EffectiveDate    = request.EffectiveDate,
            CreatedByUserId  = _currentUser.UserId
        };

        _context.EmployeeCompensations.Add(newCompensation);
        await _context.SaveChangesAsync(cancellationToken);

        return newCompensation.Id;
    }
}
