using MediatR;

namespace SoftPMS.Application.Features.Documents.Commands.DeleteDocument;

/// <summary>
/// Represents the Command to delete document.
/// </summary>
public class DeleteDocumentCommand : IRequest<Unit>
{
    public Guid Id { get; set; }
}


