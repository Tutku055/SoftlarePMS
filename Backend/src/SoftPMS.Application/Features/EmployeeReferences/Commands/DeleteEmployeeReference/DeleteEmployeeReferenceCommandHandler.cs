using MediatR;
using SoftPMS.Application.Common.Interfaces;
using SoftPMS.Domain.Entities;
using SoftPMS.Domain.Exceptions;

namespace SoftPMS.Application.Features.EmployeeReferences.Commands.DeleteEmployeeReference;

public sealed class DeleteEmployeeReferenceCommandHandler(
    IApplicationDbContext context) : IRequestHandler<DeleteEmployeeReferenceCommand>
{
    public async Task Handle(DeleteEmployeeReferenceCommand request, CancellationToken cancellationToken)
    {
        var reference = await context.EmployeeReferences.FindAsync(new object[] { request.ReferenceId }, cancellationToken);
        if (reference == null)
            throw new NotFoundException(nameof(EmployeeReference), request.ReferenceId);

        context.EmployeeReferences.Remove(reference);
        await context.SaveChangesAsync(cancellationToken);
    }
}
