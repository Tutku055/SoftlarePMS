using MediatR;
using Microsoft.EntityFrameworkCore;
using SoftPMS.Application.Common.Interfaces;

namespace SoftPMS.Application.Features.OvertimeTypes.Commands.UpdateOvertimeType;

public record UpdateOvertimeTypeCommand(Guid Id, string Name, decimal Multiplier) : IRequest<Unit>;

public class UpdateOvertimeTypeCommandHandler : IRequestHandler<UpdateOvertimeTypeCommand, Unit>
{
    private readonly IApplicationDbContext _context;

    public UpdateOvertimeTypeCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Unit> Handle(UpdateOvertimeTypeCommand request, CancellationToken cancellationToken)
    {
        var overtimeType = await _context.OvertimeTypes.FindAsync(new object[] { request.Id }, cancellationToken);

        if (overtimeType == null)
            throw new Exception("OvertimeType not found.");

        overtimeType.Name = request.Name;
        overtimeType.Multiplier = request.Multiplier;

        await _context.SaveChangesAsync(cancellationToken);

        return Unit.Value;
    }
}
