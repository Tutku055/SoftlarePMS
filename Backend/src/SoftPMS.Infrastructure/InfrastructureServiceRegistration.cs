using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using SoftPMS.Application.Common.Interfaces;
using SoftPMS.Infrastructure.Services;
using SoftPMS.Infrastructure.Settings;

namespace SoftPMS.Infrastructure;

public static class InfrastructureServiceRegistration
{
    public static IServiceCollection AddInfrastructureServices(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        // Bind and eagerly validate JwtSettings at startup via DataAnnotations
        services
            .AddOptions<JwtSettings>()
            .Bind(configuration.GetSection(nameof(JwtSettings)))
            .ValidateDataAnnotations()
            .ValidateOnStart();

        // Bind and eagerly validate EmailSettings at startup via DataAnnotations
        services
            .AddOptions<EmailSettings>()
            .Bind(configuration.GetSection(nameof(EmailSettings)))
            .ValidateDataAnnotations()
            .ValidateOnStart();

        services.AddHttpContextAccessor();

        services.AddScoped<IJwtTokenService, JwtTokenService>();
        services.AddScoped<ICurrentUserService, CurrentUserService>();
        services.AddScoped<IStorageService, LocalFileStorageService>();
        services.AddScoped<IEmailService, EmailService>();
        services.AddTransient<IDateTime, DateTimeService>();

        return services;
    }
}
