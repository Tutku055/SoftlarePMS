using MediatR;
using Microsoft.EntityFrameworkCore;
using SoftPMS.Application.Common.Interfaces;
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

public class EditEmployeeCompensationCommandHandler : IRequestHandler<EditEmployeeCompensationCommand, Unit>
{
    private readonly IApplicationDbContext _context;

    public EditEmployeeCompensationCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Unit> Handle(EditEmployeeCompensationCommand request, CancellationToken cancellationToken)
    {
        var compensation = await _context.EmployeeCompensations
            .FirstOrDefaultAsync(c => c.Id == request.Id && c.EmployeeId == request.EmployeeId, cancellationToken);

        if (compensation == null)
            throw new Exception("Compensation record not found");

        var activeCompensation = await _context.EmployeeCompensations
            .Where(c => c.EmployeeId == request.EmployeeId && c.EndDate == null && c.Id != request.Id)
            .FirstOrDefaultAsync(cancellationToken);

        if (activeCompensation != null && activeCompensation.EffectiveDate.Date >= request.EffectiveDate.Date)
        {
            throw new Exception("Edited compensation's effective date cannot be earlier than or equal to the current active compensation's effective date unless editing the active one.");
        }

        compensation.BaseSalary = request.BaseSalary;
        compensation.SalaryType = request.SalaryType;
        compensation.Currency = request.Currency;
        compensation.EffectiveDate = request.EffectiveDate;

        _context.EmployeeCompensations.Update(compensation);
        await _context.SaveChangesAsync(cancellationToken);

        return Unit.Value;
    }
}
