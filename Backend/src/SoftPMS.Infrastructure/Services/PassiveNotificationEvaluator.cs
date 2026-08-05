using System.Globalization;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using SoftPMS.Application.Common.Interfaces;
using SoftPMS.Application.Features.Notifications.Configurations;
using SoftPMS.Application.Features.Notifications.Models;
using SoftPMS.Application.Features.Notifications.Services;
using SoftPMS.Domain.Entities;
using SoftPMS.Domain.Enums;

namespace SoftPMS.Infrastructure.Services;

public class PassiveNotificationEvaluator : IPassiveNotificationEvaluator
{
    private readonly IApplicationDbContext _context;
    private readonly INotificationEmailTemplateBuilder _templateBuilder;
    private readonly ILogger<PassiveNotificationEvaluator> _logger;

    public PassiveNotificationEvaluator(
        IApplicationDbContext context,
        INotificationEmailTemplateBuilder templateBuilder,
        ILogger<PassiveNotificationEvaluator> logger)
    {
        _context = context;
        _templateBuilder = templateBuilder;
        _logger = logger;
    }

    public async Task<Dictionary<string, int>> EvaluateAllAsync(CancellationToken cancellationToken = default)
    {
        var results = new Dictionary<string, int>();

        var docCount = await EvaluateDocumentExpirationsAsync(cancellationToken);
        results["DocumentExpiry"] = docCount;

        var financeCount = await EvaluateFinanceAlertsAsync(cancellationToken);
        results["FinanceAlert"] = financeCount;

        return results;
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

        // Load only documents that have reached their reminder date or are within the threshold window
        var documents = await _context.Documents
            .AsNoTracking()
            .Where(d => (d.ExpiryDate != null && d.ExpiryDate.Value.Date <= thresholdDate)
                     || (d.ReminderDate != null && d.ReminderDate.Value.Date <= today))
            .ToListAsync(cancellationToken);

        if (documents.Count == 0)
        {
            return 0;
        }

        // Fetch referenced employees for proper naming and navigation
        var employeeIds = documents
            .Where(d => d.OwnerModule == DocumentModule.Employee)
            .Select(d => d.ReferenceId)
            .Distinct()
            .ToList();

        var employees = await _context.Employees
            .AsNoTracking()
            .Where(e => employeeIds.Contains(e.Id))
            .ToDictionaryAsync(e => e.Id, cancellationToken);

        // Fetch only users with required Document permissions (Documents.Read) or SuperAdmin
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

        // Load only relevant DocumentExpiry notifications (read, unread, AND soft-deleted) for the matched documents
        var relevantEntityIds = documents.Select(d => (Guid?)d.Id)
            .Concat(employeeIds.Select(id => (Guid?)id))
            .Distinct()
            .ToList();

        var allExistingNotifications = await _context.UserNotifications
            .IgnoreQueryFilters()
            .Where(n => n.Type == NotificationType.DocumentExpiry && relevantEntityIds.Contains(n.EntityReferenceId))
            .ToListAsync(cancellationToken);

        // Existing outbox notification IDs to prevent duplicate email queuing
        var existingNotifIds = allExistingNotifications.Select(n => (Guid?)n.Id).ToList();
        var existingOutboxNotificationIds = await _context.NotificationOutboxes
            .Where(o => o.NotificationId != null && existingNotifIds.Contains(o.NotificationId))
            .Select(o => o.NotificationId!.Value)
            .ToHashSetAsync(cancellationToken);

        var dispatchedCount = 0;
        var hasUpdates = false;

        foreach (var doc in documents)
        {
            DateTime targetDate;
            int remainingDays;

            if (doc.ExpiryDate.HasValue)
            {
                targetDate = doc.ExpiryDate.Value;
                remainingDays = (int)Math.Floor((doc.ExpiryDate.Value.Date - today).TotalDays);
            }
            else if (doc.ReminderDate.HasValue)
            {
                targetDate = doc.ReminderDate.Value;
                remainingDays = (int)Math.Floor((doc.ReminderDate.Value.Date - today).TotalDays);
            }
            else
            {
                continue;
            }

            // Check if document is within reminder window or overdue
            var isWithinThreshold = remainingDays <= reminderDays;
            var isReminderDateReached = doc.ReminderDate.HasValue && today >= doc.ReminderDate.Value.Date;
            var shouldNotify = isWithinThreshold || isReminderDateReached;

            Employee? employee = null;
            if (doc.OwnerModule == DocumentModule.Employee && employees.TryGetValue(doc.ReferenceId, out var emp))
            {
                employee = emp;
            }

            var employeeName = employee != null ? $"{employee.FirstName} {employee.LastName}".Trim() : "Employee";
            var entityRefId = employee?.Id ?? doc.ReferenceId;
            var expiryDateFormatted = targetDate.ToString("MMM dd, yyyy", CultureInfo.InvariantCulture);

            // All records (read+unread+deleted) for this document — used to determine who was EVER notified
            var allMatchingForDoc = allExistingNotifications
                .Where(n => n.EntityReferenceId == doc.Id
                    || (n.EntityReferenceId == entityRefId && n.Title.Contains(doc.FileName)))
                .ToList();

            // Only the unread, non-deleted ones — used for live update
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
                // Document expiry is now beyond threshold — remove obsolete UNREAD notifications only
                // (keep read ones as historical audit trail)
                if (unreadMatchingForDoc.Count > 0)
                {
                    _context.UserNotifications.RemoveRange(unreadMatchingForDoc);
                    hasUpdates = true;
                }
                continue;
            }

            var title = employee != null
                ? $"Document Expiring: {doc.FileName} ({employeeName})"
                : $"Document Expiring: {doc.FileName}";

            var message = remainingDays > 0
                ? $"The document '{doc.FileName}' for {employeeName} is scheduled to expire on {expiryDateFormatted} ({remainingDays} day(s) remaining)."
                : remainingDays == 0
                ? $"The document '{doc.FileName}' for {employeeName} expires today ({expiryDateFormatted})."
                : $"The document '{doc.FileName}' for {employeeName} expired {Math.Abs(remainingDays)} day(s) ago on {expiryDateFormatted}.";

            // Users who have ANY record (read or unread) — do NOT re-notify them
            var usersWithAnyRecord = allMatchingForDoc.Select(n => n.UserId).ToHashSet();

            // Update existing UNREAD notifications with latest data
            foreach (var notif in unreadMatchingForDoc)
            {
                notif.RemainingDays = remainingDays;
                notif.TargetDate = targetDate;
                notif.Title = title;
                notif.Message = message;
                notif.EntityReferenceId = doc.Id;
                notif.EntityReferenceType = "Document";
                notif.DeliveryChannel = channel;

                // If channel is upgraded to SystemAndMail and not yet queued for email:
                if (channel == NotificationDeliveryChannel.SystemAndMail && !existingOutboxNotificationIds.Contains(notif.Id))
                {
                    if (userMap.TryGetValue(notif.UserId, out var user) && !string.IsNullOrWhiteSpace(user.Email))
                    {
                        var htmlBody = _templateBuilder.BuildNotificationEmailHtml(notif, user.Username);
                        var outboxItem = new NotificationOutbox
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
                        };
                        _context.NotificationOutboxes.Add(outboxItem);
                        existingOutboxNotificationIds.Add(notif.Id);
                        hasUpdates = true;
                    }
                }
            }

            if (unreadMatchingForDoc.Count > 0)
            {
                hasUpdates = true;
            }

            // Create new notifications ONLY for authorized users who have ZERO records for this doc
            var newRecipients = authorizedUsers.Where(u => !usersWithAnyRecord.Contains(u.Id)).ToList();
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

                if (channel == NotificationDeliveryChannel.SystemAndMail && !string.IsNullOrWhiteSpace(user.Email))
                {
                    var htmlBody = _templateBuilder.BuildNotificationEmailHtml(newNotif, user.Username);
                    var outboxItem = new NotificationOutbox
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
                    };
                    _context.NotificationOutboxes.Add(outboxItem);
                }
                dispatchedCount++;
                hasUpdates = true;
            }
        }

        if (hasUpdates)
        {
            await _context.SaveChangesAsync(cancellationToken);
        }

        return dispatchedCount;
    }

    public async Task<int> EvaluateFinanceAlertsAsync(CancellationToken cancellationToken = default)
    {
        var setting = await _context.NotificationTypeSettings
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.Type == NotificationType.FinanceAlert, cancellationToken);

        var definition = NotificationRegistry.GetDefinition(NotificationType.FinanceAlert);
        var isMuted = setting?.IsMuted ?? definition?.DefaultIsMuted ?? false;
        if (isMuted)
        {
            _logger.LogInformation("FinanceAlert passive evaluation skipped because it is muted.");
            return 0;
        }

        var reminderDays = setting?.ReminderDays ?? definition?.DefaultReminderDays ?? 5;
        var channel = setting?.DeliveryChannel ?? definition?.DefaultDeliveryChannel ?? NotificationDeliveryChannel.System;
        var today = DateTime.UtcNow.Date;
        var currentYear = today.Year;
        var currentMonth = today.Month;

        var endOfMonth = new DateTime(currentYear, currentMonth, DateTime.DaysInMonth(currentYear, currentMonth));
        var remainingDays = (int)Math.Floor((endOfMonth.Date - today).TotalDays);

        // Strict rule: Only trigger if remaining days until period cutoff <= reminder threshold
        if (remainingDays > reminderDays)
        {
            _logger.LogInformation("FinanceAlert skipped: {RemainingDays} days remaining until period end, which is > threshold of {ReminderDays} days.",
                remainingDays, reminderDays);
            return 0;
        }

        var periodName = new DateTime(currentYear, currentMonth, 1).ToString("MMMM yyyy", CultureInfo.InvariantCulture);

        // Fetch all active employees
        var activeEmployees = await _context.Employees
            .AsNoTracking()
            .Where(e => e.EmploymentStatus == EmploymentStatus.Active && !e.IsDeleted)
            .ToListAsync(cancellationToken);

        if (activeEmployees.Count == 0)
        {
            return 0;
        }

        // Load existing monthly timesheets for this month & year
        var existingTimesheetEmployeeIds = await _context.MonthlyTimesheets
            .AsNoTracking()
            .Where(t => t.Year == currentYear && t.Month == currentMonth)
            .Select(t => t.EmployeeId)
            .Distinct()
            .ToListAsync(cancellationToken);
        var timesheetSet = new HashSet<Guid>(existingTimesheetEmployeeIds);

        // Load existing payroll slips for this month & year
        var existingPayrollEmployeeIds = await _context.PayrollSlips
            .AsNoTracking()
            .Where(p => p.Year == currentYear && p.Month == currentMonth)
            .Select(p => p.EmployeeId)
            .Distinct()
            .ToListAsync(cancellationToken);
        var payrollSet = new HashSet<Guid>(existingPayrollEmployeeIds);

        // Fetch only users with required Finance permissions (Timesheets.Read, Payrolls.Read) or SuperAdmin
        var financePermissions = definition?.RequiredPermissions ?? new[] { "Timesheets.Read", "Payrolls.Read" };
        var authorizedUsers = await _context.Users
            .AsNoTracking()
            .Include(u => u.Role)
                .ThenInclude(r => r.RolePermissions)
                    .ThenInclude(rp => rp.Permission)
            .Where(u => u.IsActive && !u.IsDeleted && u.Role.IsActive
                     && (u.Role.Name == "SuperAdmin" || u.Role.RolePermissions.Any(rp => financePermissions.Contains(rp.Permission.Name))))
            .ToListAsync(cancellationToken);

        var authorizedUserIds = authorizedUsers.Select(u => u.Id).ToHashSet();
        var userMap = authorizedUsers.ToDictionary(u => u.Id);

        // Load relevant FinanceAlert notifications (read, unread, AND soft-deleted) for active employees & period
        var employeeRefIds = activeEmployees.Select(e => (Guid?)e.Id).ToList();
        var allExistingAlerts = await _context.UserNotifications
            .IgnoreQueryFilters()
            .Where(n => n.Type == NotificationType.FinanceAlert
                     && employeeRefIds.Contains(n.EntityReferenceId)
                     && n.TargetDate != null
                     && n.TargetDate.Value.Year == currentYear
                     && n.TargetDate.Value.Month == currentMonth)
            .ToListAsync(cancellationToken);

        // Existing outbox notification IDs to prevent duplicate email queuing
        var existingAlertIds = allExistingAlerts.Select(a => (Guid?)a.Id).ToList();
        var existingOutboxNotificationIds = await _context.NotificationOutboxes
            .Where(o => o.NotificationId != null && existingAlertIds.Contains(o.NotificationId))
            .Select(o => o.NotificationId!.Value)
            .ToHashSetAsync(cancellationToken);

        var dispatchedCount = 0;
        var hasUpdates = false;

        foreach (var employee in activeEmployees)
        {
            var hasTimesheet = timesheetSet.Contains(employee.Id);
            var hasPayroll = payrollSet.Contains(employee.Id);

            // All records (read+unread+deleted) for this employee & period — existence check
            var allMatchingForEmployee = allExistingAlerts
                .Where(n => n.EntityReferenceId == employee.Id
                    && n.TargetDate != null
                    && n.TargetDate.Value.Year == currentYear
                    && n.TargetDate.Value.Month == currentMonth)
                .ToList();

            // Only unread, non-deleted ones — used for update/purge
            var unreadMatchingForEmployee = allMatchingForEmployee.Where(n => !n.IsRead && !n.IsDeleted).ToList();

            // Purge unread alerts that belong to unauthorized users
            var unauthorizedAlerts = unreadMatchingForEmployee
                .Where(a => !authorizedUserIds.Contains(a.UserId))
                .ToList();
            if (unauthorizedAlerts.Count > 0)
            {
                _context.UserNotifications.RemoveRange(unauthorizedAlerts);
                unreadMatchingForEmployee = unreadMatchingForEmployee
                    .Where(a => authorizedUserIds.Contains(a.UserId))
                    .ToList();
                hasUpdates = true;
            }

            // If employee has both timesheet and payroll, clear any previous UNREAD alerts
            if (hasTimesheet && hasPayroll)
            {
                if (unreadMatchingForEmployee.Count > 0)
                {
                    _context.UserNotifications.RemoveRange(unreadMatchingForEmployee);
                    hasUpdates = true;
                }
                continue;
            }

            var employeeName = $"{employee.FirstName} {employee.LastName}".Trim();
            string title;
            string message;

            if (!hasTimesheet && !hasPayroll)
            {
                title = $"Missing Timesheet & Payroll: {employeeName}";
                message = remainingDays >= 0
                    ? $"No monthly timesheet and no payroll record found for {employeeName} for period {periodName} ({remainingDays} day(s) remaining)."
                    : $"Period {periodName} ended {Math.Abs(remainingDays)} day(s) ago: Missing monthly timesheet and payroll for {employeeName}.";
            }
            else if (!hasTimesheet)
            {
                title = $"Missing Timesheet: {employeeName}";
                message = remainingDays >= 0
                    ? $"No monthly timesheet record found for {employeeName} for period {periodName} ({remainingDays} day(s) remaining)."
                    : $"Period {periodName} ended {Math.Abs(remainingDays)} day(s) ago: Missing monthly timesheet for {employeeName}.";
            }
            else
            {
                title = $"Missing Payroll: {employeeName}";
                message = remainingDays >= 0
                    ? $"No payroll slip generated for {employeeName} for period {periodName} ({remainingDays} day(s) remaining)."
                    : $"Period {periodName} ended {Math.Abs(remainingDays)} day(s) ago: Missing payroll slip for {employeeName}.";
            }

            // Users who have ANY record (read or unread) for this employee this period — do NOT re-notify
            var usersWithAnyRecord = allMatchingForEmployee.Select(a => a.UserId).ToHashSet();

            // Update existing UNREAD alerts with latest data
            foreach (var alert in unreadMatchingForEmployee)
            {
                alert.RemainingDays = remainingDays;
                alert.TargetDate = endOfMonth;
                alert.Title = title;
                alert.Message = message;
                alert.DeliveryChannel = channel;

                // If channel is upgraded to SystemAndMail and not yet queued for email:
                if (channel == NotificationDeliveryChannel.SystemAndMail && !existingOutboxNotificationIds.Contains(alert.Id))
                {
                    if (userMap.TryGetValue(alert.UserId, out var user) && !string.IsNullOrWhiteSpace(user.Email))
                    {
                        var htmlBody = _templateBuilder.BuildNotificationEmailHtml(alert, user.Username);
                        var outboxItem = new NotificationOutbox
                        {
                            RecipientEmail = user.Email.Trim(),
                            RecipientName = user.Username,
                            Subject = $"[SoftPMS] {alert.Title}",
                            BodyHtml = htmlBody,
                            Status = OutboxStatus.Pending,
                            RetryCount = 0,
                            MaxRetries = 3,
                            NextRetryAtUtc = DateTime.UtcNow,
                            NotificationId = alert.Id,
                            CreatedAt = DateTime.UtcNow
                        };
                        _context.NotificationOutboxes.Add(outboxItem);
                        existingOutboxNotificationIds.Add(alert.Id);
                        hasUpdates = true;
                    }
                }
            }

            if (unreadMatchingForEmployee.Count > 0)
            {
                hasUpdates = true;
            }

            // Create new alerts ONLY for authorized users who have ZERO records for this employee this period
            var newRecipients = authorizedUsers.Where(u => !usersWithAnyRecord.Contains(u.Id)).ToList();
            foreach (var user in newRecipients)
            {
                var newAlert = new UserNotification
                {
                    UserId = user.Id,
                    Type = NotificationType.FinanceAlert,
                    Title = title,
                    Message = message,
                    DeliveryChannel = channel,
                    TargetDate = endOfMonth,
                    RemainingDays = remainingDays,
                    EntityReferenceId = employee.Id,
                    EntityReferenceType = "Employee",
                    IsRead = false,
                    CreatedAt = DateTime.UtcNow
                };
                _context.UserNotifications.Add(newAlert);

                if (channel == NotificationDeliveryChannel.SystemAndMail && !string.IsNullOrWhiteSpace(user.Email))
                {
                    var htmlBody = _templateBuilder.BuildNotificationEmailHtml(newAlert, user.Username);
                    var outboxItem = new NotificationOutbox
                    {
                        RecipientEmail = user.Email.Trim(),
                        RecipientName = user.Username,
                        Subject = $"[SoftPMS] {newAlert.Title}",
                        BodyHtml = htmlBody,
                        Status = OutboxStatus.Pending,
                        RetryCount = 0,
                        MaxRetries = 3,
                        NextRetryAtUtc = DateTime.UtcNow,
                        NotificationId = newAlert.Id,
                        CreatedAt = DateTime.UtcNow
                    };
                    _context.NotificationOutboxes.Add(outboxItem);
                }
                dispatchedCount++;
                hasUpdates = true;
            }
        }

        if (hasUpdates)
        {
            await _context.SaveChangesAsync(cancellationToken);
        }

        return dispatchedCount;
    }
}
