using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using SoftPMS.Domain.Exceptions;
using SoftPMS.Application.Common.Interfaces;
using SoftPMS.Application.Features.Documents.DTOs;
using SoftPMS.Domain.Entities;

namespace SoftPMS.Application.Features.Documents.Queries;

public sealed class GetDocumentByIdQueryHandler(
    IApplicationDbContext context, 
    IMapper mapper) : IRequestHandler<GetDocumentByIdQuery, DocumentDto>
{
    public async Task<DocumentDto> Handle(GetDocumentByIdQuery request, CancellationToken cancellationToken)
    {
        var document = await context.Documents
            .AsNoTracking()
            .FirstOrDefaultAsync(d => d.Id == request.Id, cancellationToken);

        if (document == null)
            throw new NotFoundException(nameof(Document), request.Id);

        return mapper.Map<DocumentDto>(document);
    }
}
