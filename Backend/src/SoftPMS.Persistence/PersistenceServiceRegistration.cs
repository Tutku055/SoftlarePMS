using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using SoftPMS.Application.Common.Interfaces;
using SoftPMS.Infrastructure.Persistence;
using SoftPMS.Persistence.Context;
using SoftPMS.Persistence.Interceptors;

namespace SoftPMS.Persistence;

public static class PersistenceServiceRegistration
{
    public static IServiceCollection AddPersistenceServices(
        this IServiceCollection services,
        string connectionString)
    {
        // Register the audit interceptor as a scoped service so it can resolve
        // ICurrentUserService (which is also scoped — tied to the HTTP request)

        //Fake Employee for testing purpose
        services.AddScoped<ApplicationDbContextInitialiser>();
        services.AddScoped<SoftPMS.Application.Common.Interfaces.IEmployeeNumberGenerator, SoftPMS.Persistence.Services.EmployeeNumberGenerator>();


        services.AddScoped<AuditSaveChangesInterceptor>();

        services.AddDbContext<SoftPMSDbContext>((provider, options) =>
        {
            options.UseSqlServer(connectionString);

            // Wire the audit interceptor into the DbContext pipeline
            var auditInterceptor = provider.GetRequiredService<AuditSaveChangesInterceptor>();
            options.AddInterceptors(auditInterceptor);
        });

        // Register IApplicationDbContext → SoftPMSDbContext (same scoped instance)
        services.AddScoped<IApplicationDbContext>(provider =>
            provider.GetRequiredService<SoftPMSDbContext>());

        return services;
    }
}
