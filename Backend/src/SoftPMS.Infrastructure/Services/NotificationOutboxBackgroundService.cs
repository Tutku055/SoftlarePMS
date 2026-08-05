using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using SoftPMS.Application.Common.Interfaces;
using SoftPMS.Domain.Entities;
using SoftPMS.Domain.Enums;

namespace SoftPMS.Infrastructure.Services;

/// <summary>
/// Enterprise-grade, native .NET BackgroundService implementing the Transactional Outbox Worker.
/// Runs autonomously in the background without requiring third-party libraries (Hangfire/Quartz).
/// Safely manages Dependency Injection scope lifecycles, guarantees At-Least-Once Delivery,
/// executes exponential backoff retries, and eliminates database contention via composite indexing.
/// </summary>
public class NotificationOutboxBackgroundService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<NotificationOutboxBackgroundService> _logger;

    private static readonly TimeSpan PollInterval = TimeSpan.FromSeconds(10);
    private const int BatchSize = 50;

    public NotificationOutboxBackgroundService(
        IServiceScopeFactory scopeFactory,
        ILogger<NotificationOutboxBackgroundService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Notification Outbox Background Service is starting.");

        // Grace period for application initialization, database migrations, and DI readiness
        await Task.Delay(TimeSpan.FromSeconds(2), stoppingToken);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ProcessOutboxBatchAsync(stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error occurred during Outbox batch processing cycle.");
            }

            try
            {
                await Task.Delay(PollInterval, stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
        }

        _logger.LogInformation("Notification Outbox Background Service is gracefully stopping.");
    }

    private async Task ProcessOutboxBatchAsync(CancellationToken stoppingToken)
    {
        // Crucial Clean Architecture & DI Rule:
        // BackgroundService is registered as a Singleton, while DbContext and EmailService are Scoped.
        // We explicitly create a distinct IServiceScope per execution iteration to prevent memory leaks and concurrency issues.
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();
        var emailService = scope.ServiceProvider.GetRequiredService<IEmailService>();

        var now = DateTime.UtcNow;

        // Query optimized by composite index IX_NotificationOutboxes_Status_NextRetry_RetryCount
        var pendingMessages = await db.NotificationOutboxes
            .Where(x => (x.Status == OutboxStatus.Pending || (x.Status == OutboxStatus.Failed && x.RetryCount < x.MaxRetries))
                     && (x.NextRetryAtUtc == null || x.NextRetryAtUtc <= now))
            .OrderBy(x => x.CreatedAt)
            .Take(BatchSize)
            .ToListAsync(stoppingToken);

        if (pendingMessages.Count == 0)
        {
            return;
        }

        _logger.LogInformation("Processing {Count} pending outbox notification email(s).", pendingMessages.Count);

        foreach (var message in pendingMessages)
        {
            stoppingToken.ThrowIfCancellationRequested();

            try
            {
                message.Status = OutboxStatus.Processing;

                // Transmit transactional email via existing IEmailService abstraction
                await emailService.SendEmailAsync(
                    to: message.RecipientEmail,
                    subject: message.Subject,
                    body: message.BodyHtml,
                    isHtml: true,
                    cancellationToken: stoppingToken);

                // Mark successful delivery (Status = Sent / 2) and instantly clear heavy HTML body to save DB storage
                message.Status = OutboxStatus.Sent;
                message.ProcessedAtUtc = DateTime.UtcNow;
                message.ErrorMessage = null;
                message.BodyHtml = string.Empty;

                _logger.LogInformation("Outbox email {Id} successfully delivered to {Recipient}. Payload purged.",
                    message.Id, message.RecipientEmail);
            }
            catch (Exception ex)
            {
                message.RetryCount++;
                var truncatedError = ex.Message.Length > 3900 ? ex.Message[..3900] : ex.Message;
                message.ErrorMessage = truncatedError;

                if (message.RetryCount >= message.MaxRetries)
                {
                    message.Status = OutboxStatus.Failed;
                    message.NextRetryAtUtc = null;
                    _logger.LogError(ex, "Outbox email {Id} permanently failed after {MaxRetries} attempts for {Recipient}.",
                        message.Id, message.MaxRetries, message.RecipientEmail);
                }
                else
                {
                    // Progressive backoff: 1st retry in 15s, 2nd in 60s, 3rd in 180s
                    var delaySeconds = message.RetryCount switch
                    {
                        1 => 15,
                        2 => 60,
                        _ => 180
                    };
                    message.NextRetryAtUtc = DateTime.UtcNow.AddSeconds(delaySeconds);
                    message.Status = OutboxStatus.Failed;

                    _logger.LogWarning(ex, "Outbox email {Id} failed (Attempt {Attempt}/{MaxRetries}). Next retry in {Seconds}s.",
                        message.Id, message.RetryCount, message.MaxRetries, delaySeconds);
                }
            }
        }

        // Commit all batch state updates atomically in the current scope
        await db.SaveChangesAsync(stoppingToken);
    }
}
