using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using SoftPMS.Application.Features.Notifications.Services;

namespace SoftPMS.Infrastructure.Services;

public class PassiveNotificationBackgroundService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<PassiveNotificationBackgroundService> _logger;
    private static readonly TimeSpan CheckInterval = TimeSpan.FromMinutes(10);

    public PassiveNotificationBackgroundService(
        IServiceProvider serviceProvider,
        ILogger<PassiveNotificationBackgroundService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Passive Notification Background Service is starting.");

        // Initial delay to let application start up and migrations/seed finish
        await Task.Delay(TimeSpan.FromSeconds(5), stoppingToken);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _serviceProvider.CreateScope();
                var evaluator = scope.ServiceProvider.GetRequiredService<IPassiveNotificationEvaluator>();

                _logger.LogInformation("Running periodic passive notification evaluation...");
                var results = await evaluator.EvaluateAllAsync(stoppingToken);
                _logger.LogInformation("Periodic passive notification evaluation completed: {Results}", 
                    string.Join(", ", results.Select(kv => $"{kv.Key}: {kv.Value}")));
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred during periodic passive notification evaluation.");
            }

            await Task.Delay(CheckInterval, stoppingToken);
        }

        _logger.LogInformation("Passive Notification Background Service is stopping.");
    }
}
