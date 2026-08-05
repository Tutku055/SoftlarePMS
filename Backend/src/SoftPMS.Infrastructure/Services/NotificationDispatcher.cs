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
    private readonly IEmailService _emailService;
    private readonly INotificationEmailTemplateBuilder _templateBuilder;
    private readonly ILogger<NotificationDispatcher> _logger;

    public NotificationDispatcher(
        IApplicationDbContext context,
        IEmailService emailService,
        INotificationEmailTemplateBuilder templateBuilder,
        ILogger<NotificationDispatcher> logger)
    {
        _context = context;
        _emailService = emailService;
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

        // 3. Resolve recipient active users
        List<User> targetUsers;
        if (context.Audience.Scope == AudienceScope.All)
        {
            targetUsers = await _context.Users
                .Where(u => u.IsActive && !u.IsDeleted)
                .ToListAsync(cancellationToken);
        }
        else
        {
            var requestedIds = context.Audience.UserIds;
            targetUsers = await _context.Users
                .Where(u => requestedIds.Contains(u.Id) && u.IsActive && !u.IsDeleted)
                .ToListAsync(cancellationToken);
        }

        if (targetUsers.Count == 0)
        {
            _logger.LogWarning("Notification dispatch for {Type} found 0 matching active recipients.", context.Type);
            return 0;
        }

        // 4. Fan-out on write: create individual UserNotification records
        var notificationsToCreate = new List<UserNotification>(targetUsers.Count);
        foreach (var user in targetUsers)
        {
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
                CreatedAt = DateTime.UtcNow
            };

            notificationsToCreate.Add(notification);
        }

        _context.UserNotifications.AddRange(notificationsToCreate);
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Successfully persisted {Count} in-app notification records for {Type}.",
            notificationsToCreate.Count, context.Type);

        // 5. If SystemAndMail channel is active, send transactional emails
        if (channel == NotificationDeliveryChannel.SystemAndMail)
        {
            try
            {
                var emailMessages = new List<EmailMessage>();
                for (int i = 0; i < targetUsers.Count; i++)
                {
                    var user = targetUsers[i];
                    var notification = notificationsToCreate[i];

                    if (string.IsNullOrWhiteSpace(user.Email))
                    {
                        continue;
                    }

                    var htmlBody = _templateBuilder.BuildNotificationEmailHtml(notification, user.Username);
                    var emailMsg = new EmailMessage(user.Email, $"[SoftPMS] {notification.Title}", htmlBody, true);
                    emailMessages.Add(emailMsg);
                }

                if (emailMessages.Count > 0)
                {
                    await _emailService.SendEmailsAsync(emailMessages, cancellationToken);
                    _logger.LogInformation("Dispatched {Count} transactional notification emails for {Type}.",
                        emailMessages.Count, context.Type);
                }
            }
            catch (Exception ex)
            {
                // Email failure does not prevent DB notification records from remaining valid
                _logger.LogError(ex, "Failed to send notification emails for {Type}, but DB notifications were created.", context.Type);
            }
        }

        return notificationsToCreate.Count;
    }
}
