using MediatR;
using SoftPMS.Application.Features.Documents.DTOs;

namespace SoftPMS.Application.Features.Documents.Queries;

/// <summary>
/// Represents the Query to get document by id.
/// </summary>
public class GetDocumentByIdQuery : IRequest<DocumentDto>
{
    public Guid Id { get; set; }
}



