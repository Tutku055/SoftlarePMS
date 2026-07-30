using MediatR;
using Microsoft.EntityFrameworkCore;
using SoftPMS.Domain.Exceptions;
using SoftPMS.Application.Common.Interfaces;
using SoftPMS.Domain.Entities;

namespace SoftPMS.Application.Features.Documents.Commands.UpdateDocumentAvailability;

public class UpdateDocumentAvailabilityCommand : IRequest<Unit>
{
    public Guid Id { get; set; }
    public bool IsAvailable { get; set; }
}

public class UpdateDocumentAvailabilityCommandHandler : IRequestHandler<UpdateDocumentAvailabilityCommand, Unit>
{
    private readonly IApplicationDbContext _context;

    public UpdateDocumentAvailabilityCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Unit> Handle(UpdateDocumentAvailabilityCommand request, CancellationToken cancellationToken)
    {
        var document = await _context.Documents
            .FirstOrDefaultAsync(d => d.Id == request.Id, cancellationToken);

        if (document == null)
            throw new NotFoundException(nameof(Document), request.Id);

        document.IsAvailable = request.IsAvailable;
        document.LastCheckedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        return Unit.Value;
    }
}
