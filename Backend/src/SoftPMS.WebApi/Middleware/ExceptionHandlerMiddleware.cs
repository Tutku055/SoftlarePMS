using System.Text.Json;
using SoftPMS.Application.Common.Exceptions;
using SoftPMS.Domain.Exceptions;
using ApplicationValidationException = SoftPMS.Application.Common.Exceptions.ValidationException;
using DomainValidationException = SoftPMS.Domain.Exceptions.ValidationException;

namespace SoftPMS.WebApi.Middleware;

/// <summary>
/// Global exception-handling middleware. Catches all exceptions thrown during
/// request processing and returns a standardised JSON error response.
/// Stack traces are suppressed in non-Development environments.
/// </summary>
public sealed class ExceptionHandlerMiddleware(
    RequestDelegate next,
    ILogger<ExceptionHandlerMiddleware> logger,
    IHostEnvironment env)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (Exception ex)
        {
            // If headers have already been sent, we cannot change status code or write a body.
            // Re-throw and let Kestrel abort the connection cleanly.
            if (context.Response.HasStarted)
            {
                logger.LogError(ex,
                    "Exception occurred after response had started on {Method} {Path}",
                    context.Request.Method, context.Request.Path);
                throw;
            }

            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        var (statusCode, title, errors) = exception switch
        {
            // Application-layer FluentValidation failures (field-keyed dictionary)
            ApplicationValidationException validationEx =>
                (StatusCodes.Status400BadRequest, "Validation Failed",
                 (object)validationEx.Errors),

            // Domain-layer single-message validation
            DomainValidationException domainValEx =>
                (StatusCodes.Status400BadRequest, "Validation Error",
                 (object)new { message = domainValEx.Message }),

            NotFoundException notFoundEx =>
                (StatusCodes.Status404NotFound, "Resource Not Found",
                 (object)new { message = notFoundEx.Message }),

            UnauthorizedException unauthorizedEx =>
                (StatusCodes.Status401Unauthorized, "Unauthorized",
                 (object)new { message = unauthorizedEx.Message }),

            ForbiddenAccessException forbiddenEx =>
                (StatusCodes.Status403Forbidden, "Forbidden",
                 (object)new { message = forbiddenEx.Message }),

            DomainException domainEx =>
                (StatusCodes.Status422UnprocessableEntity, "Business Rule Violation",
                 (object)new { message = domainEx.Message }),

            BusinessRuleException businessEx =>
                (StatusCodes.Status400BadRequest, "Business Rule Violation",
                 (object)new { message = businessEx.Message }),

            // Catch-all — never leak stack traces in production
            _ =>
                (StatusCodes.Status500InternalServerError, "Internal Server Error",
                 (object)new { message = env.IsDevelopment() ? exception.Message : "An unexpected error occurred." })
        };

        // Only log 5xx as errors; validation/auth are informational
        if (statusCode >= 500)
            logger.LogError(exception, "Unhandled exception on {Method} {Path}", context.Request.Method, context.Request.Path);
        else
            logger.LogWarning(exception, "Handled exception ({Status}) on {Method} {Path}", statusCode, context.Request.Method, context.Request.Path);

        context.Response.ContentType = "application/json";
        context.Response.StatusCode  = statusCode;

        var body = new
        {
            status  = statusCode,
            title,
            traceId = context.TraceIdentifier,
            errors
        };

        var json = JsonSerializer.Serialize(body, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });

        await context.Response.WriteAsync(json);
    }
}

/// <summary>Extension method for clean registration in Program.cs.</summary>
public static class ExceptionHandlerMiddlewareExtensions
{
    public static IApplicationBuilder UseGlobalExceptionHandler(this IApplicationBuilder app) =>
        app.UseMiddleware<ExceptionHandlerMiddleware>();
}
