using System.Globalization;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using SoftPMS.Application.Common.Interfaces;
using SoftPMS.Application.Features.Notifications.Configurations;
using SoftPMS.Application.Features.Notifications.Services;
using SoftPMS.Domain.Entities;
using SoftPMS.Domain.Enums;

namespace SoftPMS.Infrastructure.Services.Notifications;

/// <summary>
/// Dedicated evaluator for document expiration rules.
/// Scans upcoming expiring documents within reminder windows and dispatches alerts to authorized HR users.
/// </summary>
public class DocumentExpiryEvaluator : IDocumentExpiryEvaluator
{
    private readonly IApplicationDbContext _context;
    private readonly INotificationEmailTemplateBuilder _templateBuilder;
    private readonly ILogger<DocumentExpiryEvaluator> _logger;

    public DocumentExpiryEvaluator(
        IApplicationDbContext context,
        INotificationEmailTemplateBuilder templateBuilder,
        ILogger<DocumentExpiryEvaluator> logger)
    {
        _context = context;
        _templateBuilder = templateBuilder;
        _logger = logger;
    }

    public async Task<int> EvaluateDocumentExpirationsAsync(CancellationToken cancellationToken = default)
    {
        var setting = await _context.NotificationTypeSettings
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.Type == NotificationType.DocumentExpiry, cancellationToken);

        var definition = NotificationRegistry.GetDefinition(NotificationType.DocumentExpiry);
        var isMuted = setting?.IsMuted ?? definition?.DefaultIsMuted ?? false;
        if (isMuted)
        {
            _logger.LogInformation("DocumentExpiry passive evaluation skipped because it is muted.");
            return 0;
        }

        var reminderDays = setting?.ReminderDays ?? definition?.DefaultReminderDays ?? 14;
        var channel = setting?.DeliveryChannel ?? definition?.DefaultDeliveryChannel ?? NotificationDeliveryChannel.System;
        var today = DateTime.UtcNow.Date;
        var thresholdDate = today.AddDays(reminderDays);

        // Load only documents that are within the threshold window
        var documents = await _context.Documents
            .AsNoTracking()
            .Where(d => d.ExpiryDate != null && d.ExpiryDate.Value.Date <= thresholdDate)
            .ToListAsync(cancellationToken);

        if (documents.Count == 0)
        {
            return 0;
        }

        // Fetch referenced employees for proper naming
        var employeeIds = documents
            .Where(d => d.OwnerModule == DocumentModule.Employee)
            .Select(d => d.ReferenceId)
            .Distinct()
            .ToList();

        var employees = await _context.Employees
            .AsNoTracking()
            .Where(e => employeeIds.Contains(e.Id))
            .ToDictionaryAsync(e => e.Id, cancellationToken);

        // Fetch referenced departments for proper naming
        var departmentIds = documents
            .Where(d => d.OwnerModule == DocumentModule.Department)
            .Select(d => d.ReferenceId)
            .Distinct()
            .ToList();

        var departments = await _context.Departments
            .AsNoTracking()
            .Where(d => departmentIds.Contains(d.Id))
            .ToDictionaryAsync(d => d.Id, cancellationToken);

        // Fetch authorized users with Documents.Read permission or SuperAdmin
        var docPermissions = definition?.RequiredPermissions ?? new[] { "Documents.Read" };
        var authorizedUsers = await _context.Users
            .AsNoTracking()
            .Include(u => u.Role)
                .ThenInclude(r => r.RolePermissions)
                    .ThenInclude(rp => rp.Permission)
            .Where(u => u.IsActive && !u.IsDeleted && u.Role.IsActive
                     && (u.Role.Name == "SuperAdmin" || u.Role.RolePermissions.Any(rp => docPermissions.Contains(rp.Permission.Name))))
            .ToListAsync(cancellationToken);

        var authorizedUserIds = authorizedUsers.Select(u => u.Id).ToHashSet();
        var userMap = authorizedUsers.ToDictionary(u => u.Id);

        var relevantEntityIds = documents.Select(d => (Guid?)d.Id)
            .Concat(employeeIds.Select(id => (Guid?)id))
            .Concat(departmentIds.Select(id => (Guid?)id))
            .Distinct()
            .ToList();

        var allExistingNotifications = await _context.UserNotifications
            .IgnoreQueryFilters()
            .Where(n => n.Type == NotificationType.DocumentExpiry && relevantEntityIds.Contains(n.EntityReferenceId))
            .ToListAsync(cancellationToken);

        var existingNotifIds = allExistingNotifications.Select(n => (Guid?)n.Id).ToList();
        var existingOutboxNotificationIds = await _context.NotificationOutboxes
            .Where(o => o.NotificationId != null && existingNotifIds.Contains(o.NotificationId))
            .Select(o => o.NotificationId!.Value)
            .ToHashSetAsync(cancellationToken);

        var dispatchedCount = 0;
        var hasUpdates = false;

        foreach (var doc in documents)
        {
            if (!doc.ExpiryDate.HasValue)
            {
                continue;
            }

            var targetDate = doc.ExpiryDate.Value;
            var remainingDays = (int)Math.Floor((doc.ExpiryDate.Value.Date - today).TotalDays);
            var shouldNotify = remainingDays <= reminderDays;

            Employee? employee = null;
            Department? department = null;
            string? ownerName = null;

            if (doc.OwnerModule == DocumentModule.Employee && employees.TryGetValue(doc.ReferenceId, out var emp))
            {
                employee = emp;
                ownerName = $"{emp.FirstName} {emp.LastName}".Trim();
            }
            else if (doc.OwnerModule == DocumentModule.Department && departments.TryGetValue(doc.ReferenceId, out var dept))
            {
                department = dept;
                ownerName = dept.Name.Trim();
            }

            var entityRefId = employee?.Id ?? department?.Id ?? doc.ReferenceId;
            var expiryDateFormatted = targetDate.ToString("MMM dd, yyyy", CultureInfo.InvariantCulture);

            var allMatchingForDoc = allExistingNotifications
                .Where(n => n.EntityReferenceId == doc.Id
                    || (n.EntityReferenceId == entityRefId && n.Title.Contains(doc.FileName)))
                .ToList();

            var unreadMatchingForDoc = allMatchingForDoc.Where(n => !n.IsRead && !n.IsDeleted).ToList();

            // Purge unread notifications that belong to unauthorized users
            var unauthorizedUnread = unreadMatchingForDoc
                .Where(n => !authorizedUserIds.Contains(n.UserId))
                .ToList();
            if (unauthorizedUnread.Count > 0)
            {
                _context.UserNotifications.RemoveRange(unauthorizedUnread);
                unreadMatchingForDoc = unreadMatchingForDoc
                    .Where(n => authorizedUserIds.Contains(n.UserId))
                    .ToList();
                hasUpdates = true;
            }

            if (!shouldNotify)
            {
                if (unreadMatchingForDoc.Count > 0)
                {
                    _context.UserNotifications.RemoveRange(unreadMatchingForDoc);
                    hasUpdates = true;
                }
                continue;
            }

            var title = !string.IsNullOrWhiteSpace(ownerName)
                ? $"Document Expiring: {doc.FileName} ({ownerName})"
                : $"Document Expiring: {doc.FileName}";

            var targetSubject = !string.IsNullOrWhiteSpace(ownerName) ? $"for {ownerName}" : "in the system";

            var message = remainingDays > 0
                ? $"The document '{doc.FileName}' {targetSubject} is scheduled to expire on {expiryDateFormatted} ({remainingDays} day(s) remaining)."
                : remainingDays == 0
                ? $"The document '{doc.FileName}' {targetSubject} expires today ({expiryDateFormatted})."
                : $"The document '{doc.FileName}' {targetSubject} expired {Math.Abs(remainingDays)} day(s) ago on {expiryDateFormatted}.";

            var usersWithAnyRecord = allMatchingForDoc.Select(n => n.UserId).ToHashSet();

            // Update existing UNREAD notifications with latest timing
            foreach (var notif in unreadMatchingForDoc)
            {
                notif.RemainingDays = remainingDays;
                notif.TargetDate = targetDate;
                notif.Title = title;
                notif.Message = message;
                notif.EntityReferenceId = doc.Id;
                notif.EntityReferenceType = "Document";
                notif.DeliveryChannel = channel;

                if (channel == NotificationDeliveryChannel.SystemAndMail && !existingOutboxNotificationIds.Contains(notif.Id))
                {
                    if (userMap.TryGetValue(notif.UserId, out var user) && !string.IsNullOrWhiteSpace(user.Email))
                    {
                        var htmlBody = _templateBuilder.BuildNotificationEmailHtml(notif, user.Username);
                        _context.NotificationOutboxes.Add(new NotificationOutbox
                        {
                            RecipientEmail = user.Email.Trim(),
                            RecipientName = user.Username,
                            Subject = $"[SoftPMS] {notif.Title}",
                            BodyHtml = htmlBody,
                            Status = OutboxStatus.Pending,
                            RetryCount = 0,
                            MaxRetries = 3,
                            NextRetryAtUtc = DateTime.UtcNow,
                            NotificationId = notif.Id,
                            CreatedAt = DateTime.UtcNow
                        });
                        existingOutboxNotificationIds.Add(notif.Id);
                        hasUpdates = true;
                    }
                }
            }

            if (unreadMatchingForDoc.Count > 0)
            {
                hasUpdates = true;
            }

            // Fan-out to newly authorized users who haven't received a record for this document yet
            var newRecipients = authorizedUsers
                .Where(u => !usersWithAnyRecord.Contains(u.Id))
                .ToList();

            foreach (var user in newRecipients)
            {
                var newNotif = new UserNotification
                {
                    UserId = user.Id,
                    Type = NotificationType.DocumentExpiry,
                    Title = title,
                    Message = message,
                    DeliveryChannel = channel,
                    TargetDate = targetDate,
                    RemainingDays = remainingDays,
                    EntityReferenceId = doc.Id,
                    EntityReferenceType = "Document",
                    IsRead = false,
                    CreatedAt = DateTime.UtcNow
                };

                _context.UserNotifications.Add(newNotif);
                dispatchedCount++;
                hasUpdates = true;

                if (channel == NotificationDeliveryChannel.SystemAndMail && !string.IsNullOrWhiteSpace(user.Email))
                {
                    var htmlBody = _templateBuilder.BuildNotificationEmailHtml(newNotif, user.Username);
                    _context.NotificationOutboxes.Add(new NotificationOutbox
                    {
                        RecipientEmail = user.Email.Trim(),
                        RecipientName = user.Username,
                        Subject = $"[SoftPMS] {newNotif.Title}",
                        BodyHtml = htmlBody,
                        Status = OutboxStatus.Pending,
                        RetryCount = 0,
                        MaxRetries = 3,
                        NextRetryAtUtc = DateTime.UtcNow,
                        NotificationId = newNotif.Id,
                        CreatedAt = DateTime.UtcNow
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
