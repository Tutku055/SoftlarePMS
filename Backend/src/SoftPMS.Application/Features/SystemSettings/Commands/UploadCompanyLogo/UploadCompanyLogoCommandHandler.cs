using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using SoftPMS.Application.Common.Interfaces;
using SoftPMS.Application.Features.SystemSettings.Queries.GetSystemParameters;

namespace SoftPMS.Application.Features.SystemSettings.Commands.UploadCompanyLogo;

public sealed class UploadCompanyLogoCommandHandler(IApplicationDbContext context, IStorageService storageService, IMemoryCache memoryCache)
    : IRequestHandler<UploadCompanyLogoCommand, string>
{
    public async Task<string> Handle(UploadCompanyLogoCommand request, CancellationToken cancellationToken)
    {
        var settings = await context.SystemSettings.FirstOrDefaultAsync(cancellationToken);
        if (settings == null)
        {
            settings = new Domain.Entities.SystemSetting();
            context.SystemSettings.Add(settings);
        }

        // Upload to Vault Storage
        using var stream = request.FileStream;
        var fileName = $"logo_{Guid.NewGuid()}{Path.GetExtension(request.FileName)}";
        
        // Using an empty/new Guid since this is not tied to a specific Document entity
        var relativePath = await storageService.UploadAsync(Guid.NewGuid(), stream, fileName, cancellationToken);

        // Optional: delete old logo if one exists (not implementing full cleanup for brevity)

        settings.CompanyLogoPath = relativePath;
        await context.SaveChangesAsync(cancellationToken);

        // Invalidate cache
        memoryCache.Remove(GetSystemParametersQueryHandler.CacheKey);

        return relativePath;
    }
}
