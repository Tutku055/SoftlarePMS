using MediatR;
using SoftPMS.Application.Features.Documents.DTOs;

namespace SoftPMS.Application.Features.Documents.Queries;

public class GetDocumentByIdQuery : IRequest<DocumentDto>
{
    public Guid Id { get; set; }
}
