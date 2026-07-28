using MediatR;
using Microsoft.EntityFrameworkCore;
using SoftPMS.Application.Common.Interfaces;

namespace SoftPMS.Application.Features.OvertimeTypes.Commands.DeleteOvertimeType;

public record DeleteOvertimeTypeCommand(Guid Id) : IRequest<Unit>;

public class DeleteOvertimeTypeCommandHandler : IRequestHandler<DeleteOvertimeTypeCommand, Unit>
{
    private readonly IApplicationDbContext _context;

    public DeleteOvertimeTypeCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Unit> Handle(DeleteOvertimeTypeCommand request, CancellationToken cancellationToken)
    {
        var overtimeType = await _context.OvertimeTypes.FindAsync(new object[] { request.Id }, cancellationToken);

        if (overtimeType == null)
            throw new Exception("OvertimeType not found.");

        overtimeType.IsDeleted = true;
        
        await _context.SaveChangesAsync(cancellationToken);

        return Unit.Value;
    }
}
