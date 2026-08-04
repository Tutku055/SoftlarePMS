using MediatR;
using Microsoft.EntityFrameworkCore;
using SoftPMS.Application.Common.Interfaces;
using SoftPMS.Domain.Entities;
using SoftPMS.Domain.Exceptions;

namespace SoftPMS.Application.Features.EmployeeAddresses.Commands.DeleteEmployeeAddress;

public sealed class DeleteEmployeeAddressCommandHandler(
    IApplicationDbContext context)
    : IRequestHandler<DeleteEmployeeAddressCommand, Unit>
{
    public async Task<Unit> Handle(DeleteEmployeeAddressCommand request, CancellationToken cancellationToken)
    {
        var address = await context.EmployeeAddresses
            .FirstOrDefaultAsync(a => a.Id == request.Id && a.EmployeeId == request.EmployeeId, cancellationToken);

        if (address is null)
            throw new NotFoundException(nameof(EmployeeAddress), request.Id);

        context.EmployeeAddresses.Remove(address);
        await context.SaveChangesAsync(cancellationToken);

        return Unit.Value;
    }
}
