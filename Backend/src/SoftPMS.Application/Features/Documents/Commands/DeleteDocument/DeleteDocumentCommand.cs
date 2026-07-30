using MediatR;
using Microsoft.EntityFrameworkCore;
using SoftPMS.Domain.Exceptions;
using SoftPMS.Application.Common.Interfaces;
using SoftPMS.Domain.Entities;

namespace SoftPMS.Application.Features.Documents.Commands.DeleteDocument;

public class DeleteDocumentCommand : IRequest<Unit>
{
    public Guid Id { get; set; }
}

public class DeleteDocumentCommandHandler : IRequestHandler<DeleteDocumentCommand, Unit>
{
    private readonly IApplicationDbContext _context;
    private readonly IStorageService _storageService;

    public DeleteDocumentCommandHandler(IApplicationDbContext context, IStorageService storageService)
    {
        _context = context;
        _storageService = storageService;
    }

    public async Task<Unit> Handle(DeleteDocumentCommand request, CancellationToken cancellationToken)
    {
        var document = await _context.Documents
            .FirstOrDefaultAsync(d => d.Id == request.Id, cancellationToken);

        if (document == null)
            throw new NotFoundException(nameof(Document), request.Id);

        await _storageService.DeleteAsync(document.FilePath, cancellationToken);

        _context.Documents.Remove(document);
        await _context.SaveChangesAsync(cancellationToken);

        return Unit.Value;
    }
}
