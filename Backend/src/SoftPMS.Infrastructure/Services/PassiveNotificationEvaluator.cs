using System.Globalization;
using System.Text.Json;
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

        // Load only documents that are within the threshold window
        var documents = await _context.Documents
            .AsNoTracking()
            .Where(d => d.ExpiryDate != null && d.ExpiryDate.Value.Date <= thresholdDate)
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

        // Fetch referenced departments for proper naming and navigation
        var departmentIds = documents
            .Where(d => d.OwnerModule == DocumentModule.Department)
            .Select(d => d.ReferenceId)
            .Distinct()
            .ToList();

        var departments = await _context.Departments
            .AsNoTracking()
            .Where(d => departmentIds.Contains(d.Id))
            .ToDictionaryAsync(d => d.Id, cancellationToken);

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
            .Concat(departmentIds.Select(id => (Guid?)id))
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
            if (!doc.ExpiryDate.HasValue)
            {
                continue;
            }

            var targetDate = doc.ExpiryDate.Value;
            var remainingDays = (int)Math.Floor((doc.ExpiryDate.Value.Date - today).TotalDays);

            // Check if document is within reminder window or overdue
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

            var title = !string.IsNullOrWhiteSpace(ownerName)
                ? $"Document Expiring: {doc.FileName} ({ownerName})"
                : $"Document Expiring: {doc.FileName}";

            var targetSubject = !string.IsNullOrWhiteSpace(ownerName) ? $"for {ownerName}" : "in the system";

            var message = remainingDays > 0
                ? $"The document '{doc.FileName}' {targetSubject} is scheduled to expire on {expiryDateFormatted} ({remainingDays} day(s) remaining)."
                : remainingDays == 0
                ? $"The document '{doc.FileName}' {targetSubject} expires today ({expiryDateFormatted})."
                : $"The document '{doc.FileName}' {targetSubject} expired {Math.Abs(remainingDays)} day(s) ago on {expiryDateFormatted}.";

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

        // Fetch authorized users with required Finance permissions (Timesheets.Read, Payrolls.Read) or SuperAdmin
        var financePermissions = definition?.RequiredPermissions ?? new[] { "Timesheets.Read", "Payrolls.Read" };
        var authorizedUsers = await _context.Users
            .AsNoTracking()
            .Include(u => u.Role)
                .ThenInclude(r => r.RolePermissions)
                    .ThenInclude(rp => rp.Permission)
            .Where(u => u.IsActive && !u.IsDeleted && u.Role.IsActive
                     && (u.Role.Name == "SuperAdmin" || u.Role.RolePermissions.Any(rp => financePermissions.Contains(rp.Permission.Name))))
            .ToListAsync(cancellationToken);

        if (authorizedUsers.Count == 0)
        {
            return 0;
        }

        var authorizedUserIds = authorizedUsers.Select(u => u.Id).ToHashSet();
        var dispatchedCount = 0;
        var hasUpdates = false;

        // Evaluate all periods of the current year up to currentMonth
        for (var m = 1; m <= currentMonth; m++)
        {
            var periodEndOfMonth = new DateTime(currentYear, m, DateTime.DaysInMonth(currentYear, m));
            var periodRemainingDays = (int)Math.Floor((periodEndOfMonth.Date - today).TotalDays);

            // If evaluating the current ongoing month and we haven't reached reminder threshold yet, skip
            if (m == currentMonth && periodRemainingDays > reminderDays)
            {
                _logger.LogInformation("FinanceAlert for {Year}-{Month:D2} skipped: {RemainingDays} days remaining until period end (threshold is {ReminderDays} days).",
                    currentYear, m, periodRemainingDays, reminderDays);
                continue;
            }

            var periodName = new DateTime(currentYear, m, 1).ToString("MMMM yyyy", CultureInfo.InvariantCulture);
            var periodKey = $"{currentYear}-{m:D2}";

            // Active employees employed on or before the end of this month
            var activeEmployees = await _context.Employees
                .AsNoTracking()
                .Where(e => !e.IsDeleted 
                         && e.EmploymentStatus == EmploymentStatus.Active 
                         && e.HireDate.Date <= periodEndOfMonth.Date 
                         && (e.TerminationDate == null || e.TerminationDate.Value.Date >= new DateTime(currentYear, m, 1)))
                .ToListAsync(cancellationToken);

            if (activeEmployees.Count == 0)
            {
                continue;
            }

            var empIds = activeEmployees.Select(e => e.Id).ToList();

            // Load existing timesheets & payrolls for this period
            var existingTimesheetEmployeeIds = await _context.MonthlyTimesheets
                .AsNoTracking()
                .Where(t => t.Year == currentYear && t.Month == m && empIds.Contains(t.EmployeeId))
                .Select(t => t.EmployeeId)
                .ToHashSetAsync(cancellationToken);

            var existingPayrollEmployeeIds = await _context.PayrollSlips
                .AsNoTracking()
                .Where(p => p.Year == currentYear && p.Month == m && empIds.Contains(p.EmployeeId))
                .Select(p => p.EmployeeId)
                .ToHashSetAsync(cancellationToken);

            var missingTimesheetCount = activeEmployees.Count(e => !existingTimesheetEmployeeIds.Contains(e.Id));
            var missingPayrollCount = activeEmployees.Count(e => !existingPayrollEmployeeIds.Contains(e.Id));

            // Load existing aggregated alerts for this period
            var allExistingAlertsForPeriod = await _context.UserNotifications
                .IgnoreQueryFilters()
                .Where(n => n.Type == NotificationType.FinanceAlert
                         && n.TargetDate != null
                         && n.TargetDate.Value.Year == currentYear
                         && n.TargetDate.Value.Month == m)
                .ToListAsync(cancellationToken);

            var existingAlertIds = allExistingAlertsForPeriod.Select(a => (Guid?)a.Id).ToList();
            var existingOutboxNotificationIds = await _context.NotificationOutboxes
                .Where(o => o.NotificationId != null && existingAlertIds.Contains(o.NotificationId))
                .Select(o => o.NotificationId!.Value)
                .ToHashSetAsync(cancellationToken);

            // Purge unread alerts belonging to unauthorized users
            var unauthorizedAlerts = allExistingAlertsForPeriod
                .Where(a => !a.IsRead && !a.IsDeleted && !authorizedUserIds.Contains(a.UserId))
                .ToList();
            if (unauthorizedAlerts.Count > 0)
            {
                _context.UserNotifications.RemoveRange(unauthorizedAlerts);
                allExistingAlertsForPeriod.RemoveAll(a => unauthorizedAlerts.Contains(a));
                hasUpdates = true;
            }

            // Dispatch or update aggregated notification for each authorized user based on their specific RBAC
            foreach (var user in authorizedUsers)
            {
                var isSuperAdmin = user.Role.Name == "SuperAdmin";
                var hasTimesheetPerm = isSuperAdmin || user.Role.RolePermissions.Any(rp => rp.Permission.Name == "Timesheets.Read");
                var hasPayrollPerm = isSuperAdmin || user.Role.RolePermissions.Any(rp => rp.Permission.Name == "Payrolls.Read");

                string title;
                string message;
                string missingType;
                int missingCount;
                bool shouldNotify;

                if (hasTimesheetPerm && !hasPayrollPerm && !isSuperAdmin)
                {
                    // Target Audience: Timesheets only
                    missingType = "Timesheet";
                    missingCount = missingTimesheetCount;
                    shouldNotify = missingTimesheetCount > 0;
                    title = $"Missing Timesheets: {periodName}";
                    message = periodRemainingDays >= 0
                        ? $"There are {missingTimesheetCount} employee(s) with missing timesheet records for {periodName} ({periodRemainingDays} day(s) remaining)."
                        : $"Period {periodName} ended {Math.Abs(periodRemainingDays)} day(s) ago: There are {missingTimesheetCount} employee(s) with missing timesheet records.";
                }
                else if (!hasTimesheetPerm && hasPayrollPerm && !isSuperAdmin)
                {
                    // Target Audience: Payrolls only
                    missingType = "Payroll";
                    missingCount = missingPayrollCount;
                    shouldNotify = missingPayrollCount > 0;
                    title = $"Missing Payrolls: {periodName}";
                    message = periodRemainingDays >= 0
                        ? $"There are {missingPayrollCount} employee(s) with missing payroll records for {periodName} ({periodRemainingDays} day(s) remaining)."
                        : $"Period {periodName} ended {Math.Abs(periodRemainingDays)} day(s) ago: There are {missingPayrollCount} employee(s) with missing payroll records.";
                }
                else
                {
                    // Target Audience: Combined (Both permissions or SuperAdmin)
                    shouldNotify = missingTimesheetCount > 0 || missingPayrollCount > 0;
                    missingCount = Math.Max(missingTimesheetCount, missingPayrollCount);

                    if (missingTimesheetCount > 0 && missingPayrollCount > missingTimesheetCount)
                    {
                        missingType = "Both";
                        title = $"Missing Timesheets & Payrolls: {periodName}";
                        message = periodRemainingDays >= 0
                            ? $"There are {missingTimesheetCount} employee(s) with missing timesheets and {missingPayrollCount} employee(s) with missing payroll slips for {periodName} ({periodRemainingDays} day(s) remaining)."
                            : $"Period {periodName} ended {Math.Abs(periodRemainingDays)} day(s) ago: There are {missingTimesheetCount} employee(s) with missing timesheets and {missingPayrollCount} employee(s) with missing payroll slips.";
                    }
                    else if (missingTimesheetCount > 0)
                    {
                        missingType = "Both";
                        title = $"Missing Timesheets & Payrolls: {periodName}";
                        message = periodRemainingDays >= 0
                            ? $"There are {missingTimesheetCount} employee(s) with missing timesheet and payroll records for {periodName} ({periodRemainingDays} day(s) remaining)."
                            : $"Period {periodName} ended {Math.Abs(periodRemainingDays)} day(s) ago: There are {missingTimesheetCount} employee(s) with missing timesheet and payroll records.";
                    }
                    else
                    {
                        missingType = "Payroll";
                        title = $"Missing Payrolls: {periodName}";
                        message = periodRemainingDays >= 0
                            ? $"There are {missingPayrollCount} employee(s) with missing payroll records for {periodName} ({periodRemainingDays} day(s) remaining)."
                            : $"Period {periodName} ended {Math.Abs(periodRemainingDays)} day(s) ago: There are {missingPayrollCount} employee(s) with missing payroll records.";
                    }
                }

                var payload = new
                {
                    missingType,
                    period = periodKey,
                    year = currentYear,
                    month = m,
                    missingCount,
                    missingTimesheetCount,
                    missingPayrollCount
                };
                var payloadJson = JsonSerializer.Serialize(payload);

                var existingUnread = allExistingAlertsForPeriod
                    .FirstOrDefault(a => a.UserId == user.Id && !a.IsRead && !a.IsDeleted);

                if (existingUnread != null)
                {
                    if (shouldNotify)
                    {
                        existingUnread.Title = title;
                        existingUnread.Message = message;
                        existingUnread.TargetDate = periodEndOfMonth;
                        existingUnread.RemainingDays = periodRemainingDays;
                        existingUnread.DeliveryChannel = channel;
                        existingUnread.PayloadJson = payloadJson;

                        if (channel == NotificationDeliveryChannel.SystemAndMail && !existingOutboxNotificationIds.Contains(existingUnread.Id))
                        {
                            if (!string.IsNullOrWhiteSpace(user.Email))
                            {
                                var htmlBody = _templateBuilder.BuildNotificationEmailHtml(existingUnread, user.Username);
                                _context.NotificationOutboxes.Add(new NotificationOutbox
                                {
                                    RecipientEmail = user.Email.Trim(),
                                    RecipientName = user.Username,
                                    Subject = $"[SoftPMS] {existingUnread.Title}",
                                    BodyHtml = htmlBody,
                                    Status = OutboxStatus.Pending,
                                    RetryCount = 0,
                                    MaxRetries = 3,
                                    NextRetryAtUtc = DateTime.UtcNow,
                                    NotificationId = existingUnread.Id,
                                    CreatedAt = DateTime.UtcNow
                                });
                                existingOutboxNotificationIds.Add(existingUnread.Id);
                            }
                        }
                        hasUpdates = true;
                    }
                    else
                    {
                        // All records completed for this period -> remove unread alert
                        _context.UserNotifications.Remove(existingUnread);
                        hasUpdates = true;
                    }
                }
                else
                {
                    var hasAnyRecord = allExistingAlertsForPeriod.Any(a => a.UserId == user.Id);
                    if (shouldNotify && !hasAnyRecord)
                    {
                        var newAlert = new UserNotification
                        {
                            UserId = user.Id,
                            Type = NotificationType.FinanceAlert,
                            Title = title,
                            Message = message,
                            DeliveryChannel = channel,
                            TargetDate = periodEndOfMonth,
                            RemainingDays = periodRemainingDays,
                            EntityReferenceType = "FinancePeriod",
                            PayloadJson = payloadJson,
                            IsRead = false,
                            CreatedAt = DateTime.UtcNow
                        };
                        _context.UserNotifications.Add(newAlert);

                        if (channel == NotificationDeliveryChannel.SystemAndMail && !string.IsNullOrWhiteSpace(user.Email))
                        {
                            var htmlBody = _templateBuilder.BuildNotificationEmailHtml(newAlert, user.Username);
                            _context.NotificationOutboxes.Add(new NotificationOutbox
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
                            });
                        }
                        dispatchedCount++;
                        hasUpdates = true;
                    }
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
