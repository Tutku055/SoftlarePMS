using MediatR;

namespace SoftPMS.Application.Features.Documents.Commands.UpdateDocumentAvailability;

public class UpdateDocumentAvailabilityCommand : IRequest<Unit>
{
    public Guid Id { get; set; }
    public bool IsAvailable { get; set; }
}
