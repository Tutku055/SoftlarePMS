using AutoMapper;
using MediatR;
using SoftPMS.Application.Common.Interfaces;
using SoftPMS.Domain.Entities;
using SoftPMS.Domain.Exceptions;

namespace SoftPMS.Application.Features.EmployeeReferences.Commands.UpdateEmployeeReference;

public sealed class UpdateEmployeeReferenceCommandHandler(
    IApplicationDbContext context,
    IMapper mapper) : IRequestHandler<UpdateEmployeeReferenceCommand>
{
    public async Task Handle(UpdateEmployeeReferenceCommand request, CancellationToken cancellationToken)
    {
        var reference = await context.EmployeeReferences.FindAsync(new object[] { request.ReferenceId }, cancellationToken);
        if (reference == null)
            throw new NotFoundException(nameof(EmployeeReference), request.ReferenceId);

        mapper.Map(request.Dto, reference);
        await context.SaveChangesAsync(cancellationToken);
    }
}
