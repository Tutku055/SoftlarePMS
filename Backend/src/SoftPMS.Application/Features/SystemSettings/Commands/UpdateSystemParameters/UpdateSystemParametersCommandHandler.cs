using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using SoftPMS.Application.Common.Interfaces;
using SoftPMS.Application.Features.SystemSettings.DTOs;
using SoftPMS.Application.Features.SystemSettings.Queries.GetSystemParameters;
using SoftPMS.Domain.Entities;

namespace SoftPMS.Application.Features.SystemSettings.Commands.UpdateSystemParameters;

public class UpdateSystemParametersCommandHandler(IApplicationDbContext context, IMemoryCache memoryCache)
    : IRequestHandler<UpdateSystemParametersCommand, SystemParametersDto>
{
    public async Task<SystemParametersDto> Handle(UpdateSystemParametersCommand request, CancellationToken cancellationToken)
    {
        var settings = await context.SystemSettings.FirstOrDefaultAsync(cancellationToken);
        
        if (settings == null)
        {
            settings = new SystemSetting();
            context.SystemSettings.Add(settings);
        }

        settings.CompanyName = request.CompanyName;
        settings.EmployeeNoPrefix = request.EmployeeNoPrefix;
        settings.GoLiveYear = request.GoLiveYear;
        settings.MonthlyWorkingHours = request.MonthlyWorkingHours;
        settings.DailyWorkingHours = request.DailyWorkingHours;
        settings.SmtpHost = request.SmtpHost;
        settings.SmtpPort = request.SmtpPort;
        settings.SenderName = request.SenderName;
        settings.SenderEmail = request.SenderEmail;
        settings.SmtpUserName = request.SmtpUserName;
        settings.SmtpPassword = request.SmtpPassword;
        settings.SmtpEnableSsl = request.SmtpEnableSsl;

        await context.SaveChangesAsync(cancellationToken);

        // Cache invalidation
        memoryCache.Remove(GetSystemParametersQueryHandler.CacheKey);

        return new SystemParametersDto
        {
            CompanyName = settings.CompanyName,
            CompanyLogoPath = settings.CompanyLogoPath, // Unchanged by this command
            EmployeeNoPrefix = settings.EmployeeNoPrefix,
            GoLiveYear = settings.GoLiveYear,
            MonthlyWorkingHours = settings.MonthlyWorkingHours,
            DailyWorkingHours = settings.DailyWorkingHours,
            SmtpHost = settings.SmtpHost,
            SmtpPort = settings.SmtpPort,
            SenderName = settings.SenderName,
            SenderEmail = settings.SenderEmail,
            SmtpUserName = settings.SmtpUserName,
            SmtpPassword = settings.SmtpPassword,
            SmtpEnableSsl = settings.SmtpEnableSsl
        };
    }
}
