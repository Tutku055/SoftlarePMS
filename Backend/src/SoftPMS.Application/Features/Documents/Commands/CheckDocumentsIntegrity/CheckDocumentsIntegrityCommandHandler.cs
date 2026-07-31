using MediatR;
using Microsoft.EntityFrameworkCore;
using SoftPMS.Application.Common.Interfaces;

namespace SoftPMS.Application.Features.Documents.Commands.CheckDocumentsIntegrity;

public sealed class CheckDocumentsIntegrityCommandHandler(
    IApplicationDbContext context, 
    IStorageService storageService) : IRequestHandler<CheckDocumentsIntegrityCommand, IntegrityCheckResultDto>
{
    public async Task<IntegrityCheckResultDto> Handle(CheckDocumentsIntegrityCommand request, CancellationToken cancellationToken)
    {
        var documents = await context.Documents.ToListAsync(cancellationToken);
        
        var result = new IntegrityCheckResultDto
        {
            TotalChecked = documents.Count
        };

        var now = DateTime.UtcNow;
        var modified = false;

        foreach (var doc in documents)
        {
            var exists = await storageService.FileExistsAsync(doc.FilePath, cancellationToken);
            
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
            await context.SaveChangesAsync(cancellationToken);
        }

        return result;
    }
}
