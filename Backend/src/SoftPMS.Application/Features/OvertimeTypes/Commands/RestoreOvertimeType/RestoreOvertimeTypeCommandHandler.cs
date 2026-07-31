using MediatR;
using SoftPMS.Application.Common.Interfaces;
using SoftPMS.Domain.Exceptions;
using SoftPMS.Domain.Entities;
using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;

namespace SoftPMS.Application.Features.OvertimeTypes.Commands.RestoreOvertimeType;

public sealed class RestoreOvertimeTypeCommandHandler(
    IApplicationDbContext context) : IRequestHandler<RestoreOvertimeTypeCommand>
{
    public async Task Handle(RestoreOvertimeTypeCommand request, CancellationToken cancellationToken)
    {
        var overtimeType = await context.OvertimeTypes
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(o => o.Id == request.Id, cancellationToken);

        if (overtimeType == null)
            throw new NotFoundException(nameof(OvertimeType), request.Id);

        overtimeType.IsDeleted = false; // Restore
        await context.SaveChangesAsync(cancellationToken);
    }
}
