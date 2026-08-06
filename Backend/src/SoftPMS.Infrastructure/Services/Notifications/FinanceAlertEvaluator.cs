using System.Globalization;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using SoftPMS.Application.Common.Interfaces;
using SoftPMS.Application.Features.Notifications.Configurations;
using SoftPMS.Application.Features.Notifications.Services;
using SoftPMS.Domain.Entities;
using SoftPMS.Domain.Enums;

namespace SoftPMS.Infrastructure.Services.Notifications;

/// <summary>
/// Dedicated evaluator for Finance and Timesheet missing records.
/// Aggregates missing timesheets and payrolls per month/period and dispatches alerts to finance managers.
/// </summary>
public class FinanceAlertEvaluator : IFinanceAlertEvaluator
{
    private readonly IApplicationDbContext _context;
    private readonly INotificationEmailTemplateBuilder _templateBuilder;
    private readonly ILogger<FinanceAlertEvaluator> _logger;

    public FinanceAlertEvaluator(
        IApplicationDbContext context,
        INotificationEmailTemplateBuilder templateBuilder,
        ILogger<FinanceAlertEvaluator> logger)
    {
        _context = context;
        _templateBuilder = templateBuilder;
        _logger = logger;
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

        for (var m = 1; m <= currentMonth; m++)
        {
            var periodEndOfMonth = new DateTime(currentYear, m, DateTime.DaysInMonth(currentYear, m));
            var periodRemainingDays = (int)Math.Floor((periodEndOfMonth.Date - today).TotalDays);

            if (m == currentMonth && periodRemainingDays > reminderDays)
            {
                _logger.LogInformation("FinanceAlert for {Year}-{Month:D2} skipped: {RemainingDays} days remaining until period end (threshold is {ReminderDays} days).",
                    currentYear, m, periodRemainingDays, reminderDays);
                continue;
            }

            var periodName = new DateTime(currentYear, m, 1).ToString("MMMM yyyy", CultureInfo.InvariantCulture);
            var periodKey = $"{currentYear}-{m:D2}";

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

            var missingTimesheets = new List<Employee>();
            var missingPayrolls = new List<Employee>();

            foreach (var emp in activeEmployees)
            {
                var hasTimesheet = existingTimesheetEmployeeIds.Contains(emp.Id);
                var hasPayroll = existingPayrollEmployeeIds.Contains(emp.Id);

                if (!hasTimesheet)
                {
                    missingTimesheets.Add(emp);
                }
                else if (!hasPayroll)
                {
                    missingPayrolls.Add(emp);
                }
            }

            var missingTimesheetCount = missingTimesheets.Count;
            var missingPayrollCount = missingPayrolls.Count;
            var totalMissingCount = missingTimesheetCount + missingPayrollCount;

            var existingPeriodNotifications = await _context.UserNotifications
                .IgnoreQueryFilters()
                .Where(n => n.Type == NotificationType.FinanceAlert 
                         && n.EntityReferenceType == "FinancePeriod" 
                         && n.Title.Contains(periodName))
                .ToListAsync(cancellationToken);

            var unreadPeriodNotifications = existingPeriodNotifications.Where(n => !n.IsRead && !n.IsDeleted).ToList();

            var unauthorizedUnread = unreadPeriodNotifications
                .Where(n => !authorizedUserIds.Contains(n.UserId))
                .ToList();
            if (unauthorizedUnread.Count > 0)
            {
                _context.UserNotifications.RemoveRange(unauthorizedUnread);
                unreadPeriodNotifications = unreadPeriodNotifications
                    .Where(n => authorizedUserIds.Contains(n.UserId))
                    .ToList();
                hasUpdates = true;
            }

            if (totalMissingCount == 0)
            {
                if (unreadPeriodNotifications.Count > 0)
                {
                    _context.UserNotifications.RemoveRange(unreadPeriodNotifications);
                    hasUpdates = true;
                }
                continue;
            }

            var title = $"Pending Finance Approvals - {periodName}";
            string message;
            if (missingTimesheetCount > 0 && missingPayrollCount > 0)
            {
                message = $"{missingTimesheetCount} employee(s) are missing timesheets, and {missingPayrollCount} employee(s) have pending payroll slips for {periodName}.";
            }
            else if (missingTimesheetCount > 0)
            {
                message = $"{missingTimesheetCount} employee(s) have unsubmitted timesheets for {periodName}.";
            }
            else
            {
                message = $"{missingPayrollCount} employee(s) have pending payroll slips for {periodName}.";
            }

            if (periodRemainingDays > 0)
            {
                message += $" ({periodRemainingDays} day(s) remaining until period cutoff).";
            }
            else if (periodRemainingDays == 0)
            {
                message += " (Period cutoff is today).";
            }
            else
            {
                message += $" (Period is overdue by {Math.Abs(periodRemainingDays)} day(s)).";
            }

            var payloadJson = JsonSerializer.Serialize(new
            {
                period = periodKey,
                year = currentYear,
                month = m,
                missingTimesheetCount,
                missingPayrollCount,
                totalMissingCount,
                missingType = (missingTimesheetCount > 0 && missingPayrollCount > 0) ? "Both" : (missingTimesheetCount > 0 ? "Timesheet" : "Payroll"),
                remainingDays = periodRemainingDays,
                targetDate = periodEndOfMonth,
                missingTimesheetEmployeeIds = missingTimesheets.Select(e => e.Id).Take(50).ToList(),
                missingPayrollEmployeeIds = missingPayrolls.Select(e => e.Id).Take(50).ToList()
            });

            if (unreadPeriodNotifications.Count > 0)
            {
                foreach (var notif in unreadPeriodNotifications)
                {
                    notif.RemainingDays = periodRemainingDays;
                    notif.TargetDate = periodEndOfMonth;
                    notif.Title = title;
                    notif.Message = message;
                    notif.DeliveryChannel = channel;
                    notif.PayloadJson = payloadJson;
                }
                hasUpdates = true;
            }

            var usersWithAnyRecord = existingPeriodNotifications.Select(n => n.UserId).ToHashSet();
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

        if (hasUpdates)
        {
            await _context.SaveChangesAsync(cancellationToken);
        }

        return dispatchedCount;
    }
}
