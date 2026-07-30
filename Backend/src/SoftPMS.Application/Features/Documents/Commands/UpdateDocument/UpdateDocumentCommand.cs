using MediatR;
using Microsoft.EntityFrameworkCore;
using SoftPMS.Application.Common.Interfaces;
using SoftPMS.Domain.Entities;
using SoftPMS.Domain.Enums;
using SoftPMS.Domain.Exceptions;

namespace SoftPMS.Application.Features.Documents.Commands.UpdateDocument;

public class UpdateDocumentCommand : IRequest
{
    public Guid Id { get; set; }
    public string FileName { get; set; } = string.Empty;
    public DocumentType DocumentType { get; set; }
    public DateTime? IssueDate { get; set; }
    public DateTime? ExpiryDate { get; set; }
    public DateTime? ReminderDate { get; set; }
}

public class UpdateDocumentCommandHandler : IRequestHandler<UpdateDocumentCommand>
{
    private readonly IApplicationDbContext _context;

    public UpdateDocumentCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task Handle(UpdateDocumentCommand request, CancellationToken cancellationToken)
    {
        var document = await _context.Documents
            .FirstOrDefaultAsync(d => d.Id == request.Id, cancellationToken);

        if (document == null)
            throw new NotFoundException(nameof(Document), request.Id);

        document.FileName = request.FileName;
        document.DocumentType = request.DocumentType;
        document.IssueDate = request.IssueDate;
        document.ExpiryDate = request.ExpiryDate;
        document.ReminderDate = request.ReminderDate;

        await _context.SaveChangesAsync(cancellationToken);
    }
}
