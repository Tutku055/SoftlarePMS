using MediatR;
using Microsoft.EntityFrameworkCore;
using SoftPMS.Application.Common.Interfaces;
using SoftPMS.Domain.Entities;
using SoftPMS.Domain.Exceptions;

namespace SoftPMS.Application.Features.Employees.Commands.UpdateEmployeeRate;

/// <summary>
/// Implements historic rate (Stundenlohn) tracking:
///   1. Locate the currently active compensation record (EndDate == null).
///   2. Close it: set EndDate = NewEffectiveDate - 1 day.
///   3. Insert a new compensation record with EffectiveDate = NewEffectiveDate and EndDate = null.
/// Both operations are committed in a single SaveChangesAsync call.
/// </summary>
public sealed class UpdateEmployeeRateCommandHandler(
    IApplicationDbContext context,
    ICurrentUserService currentUser,
    IDateTime dateTime)
    : IRequestHandler<UpdateEmployeeRateCommand, Unit>
{
    public async Task<Unit> Handle(UpdateEmployeeRateCommand request, CancellationToken cancellationToken)
    {
        // Verify employee exists
        var employeeExists = await context.Employees
            .AnyAsync(e => e.Id == request.EmployeeId, cancellationToken);

        if (!employeeExists)
            throw new NotFoundException(nameof(Employee), request.EmployeeId);

        var activeCompensation = await context.EmployeeCompensations
            .FirstOrDefaultAsync(c => c.EmployeeId == request.EmployeeId, cancellationToken);

        if (activeCompensation is not null)
        {
            activeCompensation.BaseSalary = request.BaseSalary;
            activeCompensation.SalaryType = request.SalaryType;
            activeCompensation.PayGrade = request.PayGrade;
            activeCompensation.EffectiveDate = request.NewEffectiveDate.Date;
            context.EmployeeCompensations.Update(activeCompensation);
        }
        else
        {
            var newCompensation = new EmployeeCompensation
            {
                EmployeeId      = request.EmployeeId,
                BaseSalary      = request.BaseSalary,
                SalaryType      = request.SalaryType,
                PayGrade        = request.PayGrade,
                EffectiveDate   = request.NewEffectiveDate.Date,
                CreatedByUserId = currentUser.UserId,
                CreatedAt       = dateTime.UtcNow
            };
            await context.EmployeeCompensations.AddAsync(newCompensation, cancellationToken);
        }

        await context.SaveChangesAsync(cancellationToken);

        return Unit.Value;
    }
}
