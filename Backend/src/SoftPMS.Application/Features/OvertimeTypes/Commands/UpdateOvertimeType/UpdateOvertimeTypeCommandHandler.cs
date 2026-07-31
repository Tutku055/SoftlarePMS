using MediatR;
using Microsoft.EntityFrameworkCore;
using SoftPMS.Application.Common.Interfaces;

namespace SoftPMS.Application.Features.OvertimeTypes.Commands.UpdateOvertimeType;

public sealed class UpdateOvertimeTypeCommandHandler(
    IApplicationDbContext context) : IRequestHandler<UpdateOvertimeTypeCommand, Unit>
{
    public async Task<Unit> Handle(UpdateOvertimeTypeCommand request, CancellationToken cancellationToken)
    {
        var overtimeType = await context.OvertimeTypes.FindAsync(new object[] { request.Id }, cancellationToken);

        if (overtimeType == null)
            throw new Exception("OvertimeType not found.");

        overtimeType.Name = request.Name;
        overtimeType.Multiplier = request.Multiplier;

        await context.SaveChangesAsync(cancellationToken);

        return Unit.Value;
    }
}
