using MediatR;
using Microsoft.EntityFrameworkCore;
using SoftPMS.Application.Common.Interfaces;
using SoftPMS.Domain.Entities;
using SoftPMS.Domain.Enums;
using SoftPMS.Application.Common.Exceptions;

namespace SoftPMS.Application.Features.EmployeeCompensations.Commands.UpdateEmployeeCompensation;

public sealed class UpdateEmployeeCompensationCommandHandler(
    IApplicationDbContext context,
    ICurrentUserService currentUser) : IRequestHandler<UpdateEmployeeCompensationCommand, Guid>
{
    public async Task<Guid> Handle(UpdateEmployeeCompensationCommand request, CancellationToken cancellationToken)
    {
        if (request.EffectiveDate.Day != 1)
        {
            throw new Exception("New compensation's effective date must be the 1st day of the month.");
        }

        var employee = await context.Employees.FindAsync(new object[] { request.EmployeeId }, cancellationToken);
        if (employee == null)
            throw new Exception("Employee not found");

        var existingCompensationForMonth = await context.EmployeeCompensations
            .AnyAsync(c => c.EmployeeId == request.EmployeeId && 
                           c.EffectiveDate.Year == request.EffectiveDate.Year && 
                           c.EffectiveDate.Month == request.EffectiveDate.Month, cancellationToken);
                           
        if (existingCompensationForMonth)
        {
            throw new BusinessRuleException("A compensation record already exists for this month. Only one compensation is allowed per month.");
        }

        var activeCompensation = await context.EmployeeCompensations
            .Where(c => c.EmployeeId == request.EmployeeId && c.EndDate == null)
            .FirstOrDefaultAsync(cancellationToken);

        if (activeCompensation != null)
        {
            if (request.EffectiveDate.Date <= activeCompensation.EffectiveDate.Date)
            {
                throw new BusinessRuleException("New compensation's effective date must be later than the current active compensation's effective date.");
            }
            activeCompensation.EndDate = request.EffectiveDate.AddDays(-1);
            context.EmployeeCompensations.Update(activeCompensation);

            // Hourly → Monthly: seed default leave and working-hours values.
            if (activeCompensation.SalaryType == SalaryType.Hourly && request.SalaryType == SalaryType.Monthly)
            {
                employee.WorkingHoursPerWeek = 40;
                employee.AnnualVacationDays = 14;
                employee.CarriedOverLeaves = 0;
                context.Employees.Update(employee);
            }
            // Monthly → Hourly or new Hourly: clear all leave counters.
            else if (request.SalaryType == SalaryType.Hourly)
            {
                employee.WorkingHoursPerWeek = 0;
                employee.AnnualVacationDays = 0;
                employee.CarriedOverLeaves = 0;
                context.Employees.Update(employee);
            }
        }
        else if (request.SalaryType == SalaryType.Monthly && employee.WorkingHoursPerWeek == 0)
        {
             employee.WorkingHoursPerWeek = 40;
             employee.AnnualVacationDays = 14;
             employee.CarriedOverLeaves = 0;
             context.Employees.Update(employee);
        }
        else if (request.SalaryType == SalaryType.Hourly)
        {
             employee.WorkingHoursPerWeek = 0;
             employee.AnnualVacationDays = 0;
             employee.CarriedOverLeaves = 0;
             context.Employees.Update(employee);
        }

        var newCompensation = new EmployeeCompensation
        {
            EmployeeId       = request.EmployeeId,
            BaseSalary       = request.BaseSalary,
            SalaryType       = request.SalaryType,
            Currency         = request.Currency,
            EffectiveDate    = request.EffectiveDate,
            EndDate          = null,
            CreatedByUserId  = currentUser.UserId
        };

        context.EmployeeCompensations.Add(newCompensation);
        await context.SaveChangesAsync(cancellationToken);

        return newCompensation.Id;
    }
}
