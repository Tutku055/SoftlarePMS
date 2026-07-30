using MediatR;
using SoftPMS.Application.Common.Interfaces;
using SoftPMS.Domain.Exceptions;

namespace SoftPMS.Application.Features.Employees.Commands.UpdateEmployee;

/// <summary>Updates a employee's core profile. Does not touch address or compensation history.</summary>
public sealed class UpdateEmployeeCommandHandler(
    IApplicationDbContext context)
    : IRequestHandler<UpdateEmployeeCommand, Unit>
{
    public async Task<Unit> Handle(UpdateEmployeeCommand request, CancellationToken cancellationToken)
    {
        var employee = await context.Employees.FindAsync([request.EmployeeId], cancellationToken)
            ?? throw new NotFoundException(nameof(Domain.Entities.Employee), request.EmployeeId);

        // Apply core profile changes
        employee.FirstName          = request.FirstName;
        employee.LastName           = request.LastName;
        employee.Gender             = request.Gender;
        employee.DateOfBirth        = request.DateOfBirth;
        employee.Nationality        = request.Nationality;
        employee.ProfessionId       = request.ProfessionId;
        employee.EmploymentStatus   = request.EmploymentStatus;
        employee.HireDate           = request.HireDate;
        employee.TerminationDate    = request.TerminationDate;
        employee.ProbationEndDate   = request.ProbationEndDate;
        employee.WorkingHoursPerWeek = request.WorkingHoursPerWeek;
        employee.AnnualVacationDays  = request.AnnualVacationDays;
        employee.CarriedOverLeaves   = request.CarriedOverLeaves;
        employee.DepartmentId       = request.DepartmentId;

        await context.SaveChangesAsync(cancellationToken);

        return Unit.Value;
    }
}
