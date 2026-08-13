using System.Reflection;
using FluentValidation;
using MediatR;
using Microsoft.Extensions.DependencyInjection;
using SoftPMS.Application.Common.Behaviors;

namespace SoftPMS.Application;

public static class ApplicationServiceRegistration
{
    public static IServiceCollection AddApplicationServices(this IServiceCollection services)
    {
        var assembly = Assembly.GetExecutingAssembly();

        // AutoMapper
        services.AddAutoMapper(cfg => {
            cfg.AddMaps(assembly);
        });

        // MediatR
        services.AddMediatR(cfg => {
            cfg.RegisterServicesFromAssembly(assembly);
            cfg.AddOpenBehavior(typeof(LoggingBehavior<,>));
            cfg.AddOpenBehavior(typeof(ValidationBehavior<,>));
        });

        // FluentValidation — registers all AbstractValidator<T> implementations
        services.AddValidatorsFromAssembly(assembly);

        // Memory Cache
        services.AddMemoryCache();

        return services;
    }
}