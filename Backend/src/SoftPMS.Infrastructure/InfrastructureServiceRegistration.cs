using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using SoftPMS.Application.Common.Interfaces;
using SoftPMS.Application.Features.Notifications.Services;
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
        services.AddScoped<INotificationEmailTemplateBuilder, NotificationEmailTemplateBuilder>();
        services.AddScoped<INotificationDispatcher, NotificationDispatcher>();
        services.AddScoped<IDocumentExpiryEvaluator, Services.Notifications.DocumentExpiryEvaluator>();
        services.AddScoped<IFinanceAlertEvaluator, Services.Notifications.FinanceAlertEvaluator>();
        services.AddScoped<ISecurityRecurrenceAnomalyEvaluator, Services.Notifications.Evaluators.SecurityRecurrenceAnomalyEvaluator>();
        services.AddScoped<IHighVolumeMutationAnomalyEvaluator, Services.Notifications.Evaluators.HighVolumeMutationAnomalyEvaluator>();
        services.AddScoped<IPeriodAndCalendarMilestoneEvaluator, Services.Notifications.Evaluators.PeriodAndCalendarMilestoneEvaluator>();
        services.AddScoped<ISystemAnnouncementEvaluator, Services.Notifications.SystemAnnouncementEvaluator>();
        services.AddScoped<IPublicHolidayService, PublicHolidayService>();
        services.AddScoped<ICalendarNotificationEvaluator, Services.Notifications.CalendarNotificationEvaluator>();
        services.AddScoped<IPassiveNotificationEvaluator, PassiveNotificationEvaluator>();
        services.AddHostedService<PassiveNotificationBackgroundService>();
        services.AddHostedService<NotificationOutboxBackgroundService>();
        services.AddTransient<IDateTime, DateTimeService>();

        return services;
    }
}
