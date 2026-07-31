using MediatR;
using Microsoft.EntityFrameworkCore;
using SoftPMS.Domain.Exceptions;
using SoftPMS.Application.Common.Interfaces;
using SoftPMS.Domain.Entities;

namespace SoftPMS.Application.Features.Documents.Commands.UpdateDocumentAvailability;

public sealed class UpdateDocumentAvailabilityCommandHandler(
    IApplicationDbContext context) : IRequestHandler<UpdateDocumentAvailabilityCommand, Unit>
{
    public async Task<Unit> Handle(UpdateDocumentAvailabilityCommand request, CancellationToken cancellationToken)
    {
        var document = await context.Documents
            .FirstOrDefaultAsync(d => d.Id == request.Id, cancellationToken);

        if (document == null)
            throw new NotFoundException(nameof(Document), request.Id);

        document.IsAvailable = request.IsAvailable;
        document.LastCheckedAt = DateTime.UtcNow;

        await context.SaveChangesAsync(cancellationToken);

        return Unit.Value;
    }
}
