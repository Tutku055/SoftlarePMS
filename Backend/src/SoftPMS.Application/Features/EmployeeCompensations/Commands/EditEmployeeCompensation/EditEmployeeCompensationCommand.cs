using MediatR;
using SoftPMS.Domain.Enums;

namespace SoftPMS.Application.Features.EmployeeCompensations.Commands.EditEmployeeCompensation;

public class EditEmployeeCompensationCommand : IRequest<Unit>
{
    public Guid Id { get; set; }
    public Guid EmployeeId { get; set; }
    public decimal BaseSalary { get; set; }
    public SalaryType SalaryType { get; set; }
    public Currency Currency { get; set; }
    public DateTime EffectiveDate { get; set; }
}
