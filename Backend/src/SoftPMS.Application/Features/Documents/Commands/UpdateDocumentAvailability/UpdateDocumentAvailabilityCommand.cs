using MediatR;

namespace SoftPMS.Application.Features.Documents.Commands.UpdateDocumentAvailability;

/// <summary>
/// Represents the Command to update document availability.
/// </summary>
public class UpdateDocumentAvailabilityCommand : IRequest<Unit>
{
    public Guid Id { get; set; }
    public bool IsAvailable { get; set; }
}


