using MediatR;
using Microsoft.EntityFrameworkCore;
using SoftPMS.Application.Common.Interfaces;

namespace SoftPMS.Application.Features.Documents.Commands.CheckDocumentsIntegrity;

public class CheckDocumentsIntegrityCommand : IRequest<IntegrityCheckResultDto>
{
}

public class IntegrityCheckResultDto
{
    public int TotalChecked { get; set; }
    public int MissingCount { get; set; }
    public int AvailableCount { get; set; }
}

public class CheckDocumentsIntegrityCommandHandler : IRequestHandler<CheckDocumentsIntegrityCommand, IntegrityCheckResultDto>
{
    private readonly IApplicationDbContext _context;
    private readonly IStorageService _storageService;

    public CheckDocumentsIntegrityCommandHandler(IApplicationDbContext context, IStorageService storageService)
    {
        _context = context;
        _storageService = storageService;
    }

    public async Task<IntegrityCheckResultDto> Handle(CheckDocumentsIntegrityCommand request, CancellationToken cancellationToken)
    {
        var documents = await _context.Documents.ToListAsync(cancellationToken);
        
        var result = new IntegrityCheckResultDto
        {
            TotalChecked = documents.Count
        };

        var now = DateTime.UtcNow;
        var modified = false;

        foreach (var doc in documents)
        {
            var exists = await _storageService.FileExistsAsync(doc.FilePath, cancellationToken);
            
            doc.LastCheckedAt = now;
            modified = true;

            if (!exists)
            {
                result.MissingCount++;
                
                if (doc.IsAvailable)
                {
                    doc.IsAvailable = false;
                }
            }
            else
            {
                result.AvailableCount++;
                
                if (!doc.IsAvailable)
                {
                    doc.IsAvailable = true;
                }
            }
        }

        if (modified)
        {
            await _context.SaveChangesAsync(cancellationToken);
        }

        return result;
    }
}
