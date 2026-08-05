using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using SoftPMS.Application.Common.Interfaces;
using SoftPMS.Application.Common.Models.Email;
using SoftPMS.Application.Features.Notifications.Configurations;
using SoftPMS.Application.Features.Notifications.Models;
using SoftPMS.Application.Features.Notifications.Services;
using SoftPMS.Domain.Entities;
using SoftPMS.Domain.Enums;

namespace SoftPMS.Infrastructure.Services;

public class NotificationDispatcher : INotificationDispatcher
{
    private readonly IApplicationDbContext _context;
    private readonly INotificationEmailTemplateBuilder _templateBuilder;
    private readonly ILogger<NotificationDispatcher> _logger;

    public NotificationDispatcher(
        IApplicationDbContext context,
        INotificationEmailTemplateBuilder templateBuilder,
        ILogger<NotificationDispatcher> logger)
    {
        _context = context;
        _templateBuilder = templateBuilder;
        _logger = logger;
    }

    public async Task<int> DispatchAsync(NotificationDispatchContext context, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(context);

        // 1. Check if the notification type is muted
        var setting = await _context.NotificationTypeSettings
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.Type == context.Type, cancellationToken);

        var definition = NotificationRegistry.GetDefinition(context.Type);

        var isMuted = setting?.IsMuted ?? definition?.DefaultIsMuted ?? false;
        if (isMuted)
        {
            _logger.LogInformation("Notification dispatch skipped because {Type} is currently muted.", context.Type);
            return 0;
        }

        // 2. Determine delivery channel
        var channel = context.OverrideChannel
            ?? setting?.DeliveryChannel
            ?? definition?.DefaultDeliveryChannel
            ?? NotificationDeliveryChannel.System;

        // 3. Resolve recipient active users based on TargetAudience scope and RBAC permissions
        List<User> targetUsers;
        if (context.Audience.Scope is AudienceScope.Single or AudienceScope.Multiple)
        {
            var requestedIds = context.Audience.UserIds;
            targetUsers = await _context.Users
                .Where(u => requestedIds.Contains(u.Id) && u.IsActive && !u.IsDeleted)
                .ToListAsync(cancellationToken);
        }
        else
        {
            // Determine required permissions from audience or registry definition
            var requiredPerms = context.Audience.Scope == AudienceScope.Permission
                ? context.Audience.RequiredPermissions
                : (definition?.RequiredPermissions ?? Array.Empty<string>());

            if (requiredPerms.Count > 0)
            {
                // Only users whose assigned active role has at least one of the required read permissions (or SuperAdmin)
                targetUsers = await _context.Users
                    .Include(u => u.Role)
                        .ThenInclude(r => r.RolePermissions)
                            .ThenInclude(rp => rp.Permission)
                    .Where(u => u.IsActive && !u.IsDeleted && u.Role.IsActive
                             && (u.Role.Name == "SuperAdmin" || u.Role.RolePermissions.Any(rp => requiredPerms.Contains(rp.Permission.Name))))
                    .ToListAsync(cancellationToken);
            }
            else
            {
                targetUsers = await _context.Users
                    .Where(u => u.IsActive && !u.IsDeleted)
                    .ToListAsync(cancellationToken);
            }
        }

        if (targetUsers.Count == 0)
        {
            _logger.LogWarning("Notification dispatch for {Type} found 0 matching authorized active recipients.", context.Type);
            return 0;
        }

        var now = DateTime.UtcNow;

        // 4. Fan-out on write: create individual UserNotification records
        var notificationsToCreate = new List<UserNotification>(targetUsers.Count);
        var outboxItemsToCreate = new List<NotificationOutbox>();

        for (int i = 0; i < targetUsers.Count; i++)
        {
            var user = targetUsers[i];
            var notification = new UserNotification
            {
                UserId = user.Id,
                Type = context.Type,
                Title = context.Title,
                Message = context.Message,
                DeliveryChannel = channel,
                TargetDate = context.TargetDate,
                RemainingDays = context.RemainingDays,
                EntityReferenceId = context.EntityReferenceId,
                EntityReferenceType = context.EntityReferenceType,
                PayloadJson = context.PayloadJson,
                IsRead = false,
                CreatedAt = now
            };

            notificationsToCreate.Add(notification);

            // 5. Transactional Outbox Pattern:
            // If SystemAndMail channel is active, stage Outbox message in the SAME database transaction.
            if (channel == NotificationDeliveryChannel.SystemAndMail && !string.IsNullOrWhiteSpace(user.Email))
            {
                var htmlBody = _templateBuilder.BuildNotificationEmailHtml(notification, user.Username);
                var outboxItem = new NotificationOutbox
                {
                    RecipientEmail = user.Email.Trim(),
                    RecipientName = user.Username,
                    Subject = $"[SoftPMS] {notification.Title}",
                    BodyHtml = htmlBody,
                    Status = OutboxStatus.Pending,
                    RetryCount = 0,
                    MaxRetries = 3,
                    NextRetryAtUtc = now,
                    NotificationId = notification.Id,
                    CreatedAt = now
                };

                outboxItemsToCreate.Add(outboxItem);
            }
        }

        // 6. Single Atomic Transaction commit (Guarantees zero Dual-Write discrepancy)
        _context.UserNotifications.AddRange(notificationsToCreate);
        if (outboxItemsToCreate.Count > 0)
        {
            _context.NotificationOutboxes.AddRange(outboxItemsToCreate);
        }

        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Successfully persisted {Count} in-app notifications and {OutboxCount} transactional outbox emails for {Type}.",
            notificationsToCreate.Count, outboxItemsToCreate.Count, context.Type);

        return notificationsToCreate.Count;
    }
}
