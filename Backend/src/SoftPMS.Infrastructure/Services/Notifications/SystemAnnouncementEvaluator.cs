using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using SoftPMS.Application.Common.Interfaces;
using SoftPMS.Application.Features.Notifications.Configurations;
using SoftPMS.Application.Features.Notifications.Models;
using SoftPMS.Application.Features.Notifications.Services;
using SoftPMS.Domain.Entities;
using SoftPMS.Domain.Enums;

namespace SoftPMS.Infrastructure.Services.Notifications;

/// <summary>
/// Dedicated evaluator for System Announcements & Audit Anomalies.
/// Orchestrates SecurityRecurrence, HighVolumeMutation, and PeriodAndCalendar anomaly evaluators.
/// </summary>
public class SystemAnnouncementEvaluator : ISystemAnnouncementEvaluator
{
    private readonly IApplicationDbContext _context;
    private readonly ISecurityRecurrenceAnomalyEvaluator _securityRecurrenceEvaluator;
    private readonly IHighVolumeMutationAnomalyEvaluator _highVolumeMutationEvaluator;
    private readonly IPeriodAndCalendarMilestoneEvaluator _periodCalendarEvaluator;
    private readonly INotificationEmailTemplateBuilder _templateBuilder;
    private readonly ILogger<SystemAnnouncementEvaluator> _logger;

    public SystemAnnouncementEvaluator(
        IApplicationDbContext context,
        ISecurityRecurrenceAnomalyEvaluator securityRecurrenceEvaluator,
        IHighVolumeMutationAnomalyEvaluator highVolumeMutationEvaluator,
        IPeriodAndCalendarMilestoneEvaluator periodCalendarEvaluator,
        INotificationEmailTemplateBuilder templateBuilder,
        ILogger<SystemAnnouncementEvaluator> logger)
    {
        _context = context;
        _securityRecurrenceEvaluator = securityRecurrenceEvaluator;
        _highVolumeMutationEvaluator = highVolumeMutationEvaluator;
        _periodCalendarEvaluator = periodCalendarEvaluator;
        _templateBuilder = templateBuilder;
        _logger = logger;
    }

    public async Task<int> EvaluateSystemAnnouncementsAsync(CancellationToken cancellationToken = default)
    {
        var setting = await _context.NotificationTypeSettings
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.Type == NotificationType.SystemAnnouncement, cancellationToken);

        var definition = NotificationRegistry.GetDefinition(NotificationType.SystemAnnouncement);
        var isMuted = setting?.IsMuted ?? definition?.DefaultIsMuted ?? false;
        if (isMuted)
        {
            _logger.LogInformation("SystemAnnouncement passive evaluation skipped because it is muted.");
            return 0;
        }

        var channel = setting?.DeliveryChannel ?? definition?.DefaultDeliveryChannel ?? NotificationDeliveryChannel.System;

        // Fetch authorized administrative recipients (SuperAdmin / Admin or AuditLogs.Read / SystemSettings.YearEndOperations)
        var systemPermissions = definition?.RequiredPermissions ?? new[] { "AuditLogs.Read", "SystemSettings.YearEndOperations" };
        var authorizedUsers = await _context.Users
            .AsNoTracking()
            .Include(u => u.Role)
                .ThenInclude(r => r.RolePermissions)
                    .ThenInclude(rp => rp.Permission)
            .Where(u => u.IsActive && !u.IsDeleted && u.Role.IsActive
                     && (u.Role.Name == "SuperAdmin" || u.Role.Name == "Admin" || u.Role.RolePermissions.Any(rp => systemPermissions.Contains(rp.Permission.Name))))
            .ToListAsync(cancellationToken);

        if (authorizedUsers.Count == 0)
        {
            return 0;
        }

        var alerts = new List<AuditAnomalyAlert>();

        // 1. Evaluate Security & Recurrence Anomalies
        await _securityRecurrenceEvaluator.EvaluateAsync(alerts, cancellationToken);

        // 2. Evaluate High-Volume Entity Mutation Anomalies
        await _highVolumeMutationEvaluator.EvaluateAsync(alerts, cancellationToken);

        // 3. Evaluate Period Closure & Business Calendar Milestones
        await _periodCalendarEvaluator.EvaluateAsync(alerts, cancellationToken);

        if (alerts.Count == 0)
        {
            return 0;
        }

        // Dispatch all accumulated anomaly alerts
        return await DispatchSystemAnnouncementsAsync(alerts, authorizedUsers, channel, cancellationToken);
    }

    private async Task<int> DispatchSystemAnnouncementsAsync(
        List<AuditAnomalyAlert> alerts,
        List<User> authorizedUsers,
        NotificationDeliveryChannel channel,
        CancellationToken cancellationToken)
    {
        var dispatchedCount = 0;
        var hasUpdates = false;
        var now = DateTime.UtcNow;

        var deduplicationKeys = alerts.Select(a => a.DeduplicationKey).Distinct().ToList();

        // Load existing notifications with these deduplication keys
        var existingNotifications = await _context.UserNotifications
            .IgnoreQueryFilters()
            .Where(n => n.Type == NotificationType.SystemAnnouncement
                     && n.PayloadJson != null
                     && deduplicationKeys.Any(k => n.PayloadJson.Contains(k)))
            .ToListAsync(cancellationToken);

        foreach (var alert in alerts)
        {
            var cooldownThreshold = now.Subtract(alert.Cooldown);

            var existingForAlert = existingNotifications
                .Where(n => n.PayloadJson != null && n.PayloadJson.Contains($"\"deduplicationKey\":\"{alert.DeduplicationKey}\""))
                .ToList();

            var recentAlert = existingForAlert
                .Where(n => n.CreatedAt >= cooldownThreshold)
                .OrderByDescending(n => n.CreatedAt)
                .FirstOrDefault();

            var enrichedPayload = new Dictionary<string, object?>(alert.AnomalyDetails)
            {
                ["evaluatorDomain"] = alert.EvaluatorDomain,
                ["ruleCode"] = alert.RuleCode,
                ["severity"] = alert.Severity,
                ["deduplicationKey"] = alert.DeduplicationKey,
                ["detectedAt"] = now
            };
            var payloadJson = JsonSerializer.Serialize(enrichedPayload);

            // If a notification was already sent within cooldown window, update unread records
            if (recentAlert != null)
            {
                var unreadRecords = existingForAlert.Where(n => !n.IsRead && !n.IsDeleted).ToList();
                if (unreadRecords.Count > 0)
                {
                    foreach (var unread in unreadRecords)
                    {
                        unread.Title = alert.Title;
                        unread.Message = alert.Message;
                        unread.DeliveryChannel = channel;
                        unread.PayloadJson = payloadJson;
                        unread.EntityReferenceId = alert.EntityReferenceId;
                        unread.EntityReferenceType = alert.EntityReferenceType;
                        unread.TargetDate = alert.TargetDate;
                        unread.RemainingDays = alert.RemainingDays;
                    }
                    hasUpdates = true;
                    continue;
                }
                else if (alert.Severity != "Critical" && alert.Severity != "High")
                {
                    // Already read and severity is low/moderate, suppress duplicate spam within cooldown
                    continue;
                }
            }

            // Create new notification for authorized users
            foreach (var user in authorizedUsers)
            {
                var notif = new UserNotification
                {
                    UserId = user.Id,
                    Type = NotificationType.SystemAnnouncement,
                    Title = alert.Title,
                    Message = alert.Message,
                    DeliveryChannel = channel,
                    TargetDate = alert.TargetDate,
                    RemainingDays = alert.RemainingDays,
                    EntityReferenceId = alert.EntityReferenceId,
                    EntityReferenceType = alert.EntityReferenceType,
                    PayloadJson = payloadJson,
                    IsRead = false,
                    CreatedAt = now
                };

                _context.UserNotifications.Add(notif);
                dispatchedCount++;
                hasUpdates = true;

                if (channel == NotificationDeliveryChannel.SystemAndMail && !string.IsNullOrWhiteSpace(user.Email))
                {
                    var htmlBody = _templateBuilder.BuildNotificationEmailHtml(notif, user.Username);
                    _context.NotificationOutboxes.Add(new NotificationOutbox
                    {
                        RecipientEmail = user.Email.Trim(),
                        RecipientName = user.Username,
                        Subject = $"[SoftPMS Security/System Alert] {notif.Title}",
                        BodyHtml = htmlBody,
                        Status = OutboxStatus.Pending,
                        RetryCount = 0,
                        MaxRetries = 3,
                        NextRetryAtUtc = now,
                        NotificationId = notif.Id,
                        CreatedAt = now
                    });
                }
            }
        }

        if (hasUpdates)
        {
            await _context.SaveChangesAsync(cancellationToken);
        }

        return dispatchedCount;
    }
}
