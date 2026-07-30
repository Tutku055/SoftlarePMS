using MediatR;
using Microsoft.EntityFrameworkCore;
using SoftPMS.Application.Common.Interfaces;
using SoftPMS.Domain.Entities;
using SoftPMS.Domain.Enums;

namespace SoftPMS.Application.Features.EmployeeCompensations.Commands.UpdateEmployeeCompensation;

public class UpdateEmployeeCompensationCommand : IRequest<Guid>
{
    public Guid EmployeeId { get; set; }
    public decimal BaseSalary { get; set; }
    public SalaryType SalaryType { get; set; }
    public Currency Currency { get; set; }
    public DateTime EffectiveDate { get; set; }
}

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

            // If switching from Hourly to Monthly, set default values for vacation and hours
            if (activeCompensation.SalaryType == SalaryType.Hourly && request.SalaryType == SalaryType.Monthly)
            {
                employee.WorkingHoursPerWeek = 40;
                employee.AnnualVacationDays = 14;
                employee.CarriedOverLeaves = 0;
                _context.Employees.Update(employee);
            }
            // If switching to Hourly, reset all vacation counters to 0
            else if (request.SalaryType == SalaryType.Hourly)
            {
                employee.WorkingHoursPerWeek = 0;
                employee.AnnualVacationDays = 0;
                employee.CarriedOverLeaves = 0;
                _context.Employees.Update(employee);
            }
        }
        else if (request.SalaryType == SalaryType.Monthly && employee.WorkingHoursPerWeek == 0)
        {
             // Fallback if no active compensation existed but transitioning to Monthly
             employee.WorkingHoursPerWeek = 40;
             employee.AnnualVacationDays = 14;
             employee.CarriedOverLeaves = 0;
             _context.Employees.Update(employee);
        }
        else if (request.SalaryType == SalaryType.Hourly)
        {
             // Fallback if no active compensation existed but transitioning to Hourly
             employee.WorkingHoursPerWeek = 0;
             employee.AnnualVacationDays = 0;
             employee.CarriedOverLeaves = 0;
             _context.Employees.Update(employee);
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
