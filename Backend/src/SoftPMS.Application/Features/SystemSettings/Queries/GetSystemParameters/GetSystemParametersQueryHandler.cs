using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using SoftPMS.Application.Common.Interfaces;
using SoftPMS.Application.Features.SystemSettings.DTOs;

namespace SoftPMS.Application.Features.SystemSettings.Queries.GetSystemParameters;

public class GetSystemParametersQueryHandler(IApplicationDbContext context, IMemoryCache memoryCache)
    : IRequestHandler<GetSystemParametersQuery, SystemParametersDto>
{
    public const string CacheKey = "SystemSettings_CacheKey";

    public async Task<SystemParametersDto> Handle(GetSystemParametersQuery request, CancellationToken cancellationToken)
    {
        if (memoryCache.TryGetValue(CacheKey, out SystemParametersDto? cachedSettings) && cachedSettings != null)
        {
            return cachedSettings;
        }

        var settings = await context.SystemSettings.FirstOrDefaultAsync(cancellationToken);
        
        if (settings == null)
        {
            return new SystemParametersDto(); // Fallback to defaults
        }

        var dto = new SystemParametersDto
        {
            CompanyName = settings.CompanyName ?? string.Empty,
            CompanyLogoPath = settings.CompanyLogoPath ?? string.Empty,
            EmployeeNoPrefix = settings.EmployeeNoPrefix ?? "EMP",
            GoLiveYear = settings.GoLiveYear,
            MonthlyWorkingHours = settings.MonthlyWorkingHours,
            DailyWorkingHours = settings.DailyWorkingHours,
            SmtpHost = settings.SmtpHost ?? "localhost",
            SmtpPort = settings.SmtpPort,
            SenderName = settings.SenderName ?? string.Empty,
            SenderEmail = settings.SenderEmail ?? string.Empty,
            SmtpUserName = settings.SmtpUserName ?? string.Empty,
            SmtpPassword = settings.SmtpPassword ?? string.Empty,
            SmtpEnableSsl = settings.SmtpEnableSsl
        };

        memoryCache.Set(CacheKey, dto, TimeSpan.FromHours(12)); // Cache for 12 hours

        return dto;
    }
}
