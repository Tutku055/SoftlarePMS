using MediatR;
using SoftPMS.Domain.Enums;

namespace SoftPMS.Application.Features.Employees.Commands.UpdateEmployeeRate;

/// <summary>
/// Command to set a new hourly/monthly rate (Stundenlohn) for an employee.
/// The current active compensation record (EndDate == null) will be closed at
/// NewEffectiveDate - 1 day, and a new record is inserted as the active rate.
/// </summary>
public sealed record UpdateEmployeeRateCommand(
    Guid EmployeeId,
    decimal BaseSalary,
    SalaryType SalaryType,
    DateTime NewEffectiveDate
) : IRequest<Unit>;
