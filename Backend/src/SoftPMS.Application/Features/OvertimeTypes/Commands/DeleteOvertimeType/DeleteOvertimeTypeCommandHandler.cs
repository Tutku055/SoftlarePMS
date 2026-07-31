using MediatR;
using Microsoft.EntityFrameworkCore;
using SoftPMS.Application.Common.Interfaces;

namespace SoftPMS.Application.Features.OvertimeTypes.Commands.DeleteOvertimeType;

public sealed class DeleteOvertimeTypeCommandHandler(
    IApplicationDbContext context) : IRequestHandler<DeleteOvertimeTypeCommand, Unit>
{
    public async Task<Unit> Handle(DeleteOvertimeTypeCommand request, CancellationToken cancellationToken)
    {
        var overtimeType = await context.OvertimeTypes.FindAsync(new object[] { request.Id }, cancellationToken);

        if (overtimeType == null)
            throw new Exception("OvertimeType not found.");

        overtimeType.IsDeleted = true;
        
        await context.SaveChangesAsync(cancellationToken);

        return Unit.Value;
    }
}
