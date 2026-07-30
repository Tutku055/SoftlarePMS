using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using SoftPMS.Domain.Exceptions;
using SoftPMS.Application.Common.Interfaces;
using SoftPMS.Application.Features.Documents.DTOs;
using SoftPMS.Domain.Entities;

namespace SoftPMS.Application.Features.Documents.Queries;

public class GetDocumentByIdQuery : IRequest<DocumentDto>
{
    public Guid Id { get; set; }
}

public class GetDocumentByIdQueryHandler : IRequestHandler<GetDocumentByIdQuery, DocumentDto>
{
    private readonly IApplicationDbContext _context;
    private readonly IMapper _mapper;

    public GetDocumentByIdQueryHandler(IApplicationDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<DocumentDto> Handle(GetDocumentByIdQuery request, CancellationToken cancellationToken)
    {
        var document = await _context.Documents
            .AsNoTracking()
            .FirstOrDefaultAsync(d => d.Id == request.Id, cancellationToken);

        if (document == null)
            throw new NotFoundException(nameof(Document), request.Id);

        return _mapper.Map<DocumentDto>(document);
    }
}
