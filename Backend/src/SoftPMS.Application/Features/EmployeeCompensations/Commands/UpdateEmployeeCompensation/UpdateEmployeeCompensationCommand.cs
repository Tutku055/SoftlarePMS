using MediatR;
using SoftPMS.Domain.Enums;

namespace SoftPMS.Application.Features.EmployeeCompensations.Commands.UpdateEmployeeCompensation;

/// <summary>
/// Represents the Command to update employee compensation.
/// </summary>
public class UpdateEmployeeCompensationCommand : IRequest<Guid>
{
    public Guid EmployeeId { get; set; }
    public decimal BaseSalary { get; set; }
    public SalaryType SalaryType { get; set; }
    public Currency Currency { get; set; }
    public DateTime EffectiveDate { get; set; }
}


