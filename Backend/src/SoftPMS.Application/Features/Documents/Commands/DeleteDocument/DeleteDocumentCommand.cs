using MediatR;

namespace SoftPMS.Application.Features.Documents.Commands.DeleteDocument;

public class DeleteDocumentCommand : IRequest<Unit>
{
    public Guid Id { get; set; }
}
