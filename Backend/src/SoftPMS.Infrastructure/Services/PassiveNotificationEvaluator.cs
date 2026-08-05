using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using SoftPMS.Application.Common.Interfaces;
using SoftPMS.Application.Features.Notifications.Configurations;
using SoftPMS.Application.Features.Notifications.Models;
using SoftPMS.Application.Features.Notifications.Services;
using SoftPMS.Domain.Enums;

namespace SoftPMS.Infrastructure.Services;

public class PassiveNotificationEvaluator : IPassiveNotificationEvaluator
{
    private readonly IApplicationDbContext _context;
    private readonly INotificationDispatcher _dispatcher;
    private readonly ILogger<PassiveNotificationEvaluator> _logger;

    public PassiveNotificationEvaluator(
        IApplicationDbContext context,
        INotificationDispatcher dispatcher,
        ILogger<PassiveNotificationEvaluator> logger)
    {
        _context = context;
        _dispatcher = dispatcher;
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
        var today = DateTime.UtcNow.Date;
        var thresholdDate = today.AddDays(reminderDays);

        // Find documents expiring on or before the threshold date
        var expiringDocs = await _context.Documents
            .Where(d => d.ExpiryDate != null && d.ExpiryDate.Value.Date <= thresholdDate && d.IsAvailable)
            .ToListAsync(cancellationToken);

        if (expiringDocs.Count == 0)
        {
            return 0;
        }

        var dispatchedCount = 0;
        var oneDayAgo = DateTime.UtcNow.AddHours(-24);

        foreach (var doc in expiringDocs)
        {
            // Deduplication: Skip if already notified in the last 24 hours
            var alreadyNotified = await _context.UserNotifications
                .AnyAsync(n => n.EntityReferenceId == doc.Id
                    && n.Type == NotificationType.DocumentExpiry
                    && n.CreatedAt >= oneDayAgo, cancellationToken);

            if (alreadyNotified)
            {
                continue;
            }

            var remainingDays = (int)(doc.ExpiryDate!.Value.Date - today).TotalDays;

            // Resolve target users: user mapped to the employee or document creator
            var targetUserIds = new HashSet<Guid>();

            if (doc.OwnerModule == DocumentModule.Employee)
            {
                var employeeUser = await _context.Users
                    .Where(u => u.EmployeeId == doc.ReferenceId && u.IsActive && !u.IsDeleted)
                    .Select(u => u.Id)
                    .FirstOrDefaultAsync(cancellationToken);

                if (employeeUser != Guid.Empty)
                {
                    targetUserIds.Add(employeeUser);
                }
            }

            if (doc.CreatedByUserId != Guid.Empty)
            {
                targetUserIds.Add(doc.CreatedByUserId);
            }

            TargetAudience audience = targetUserIds.Count > 0
                ? TargetAudience.ForMultipleUsers(targetUserIds)
                : TargetAudience.ForAllUsers();

            var title = $"Document Expiring: {doc.FileName}";
            var message = remainingDays >= 0
                ? $"The document '{doc.FileName}' is scheduled to expire in {remainingDays} day(s) on {doc.ExpiryDate.Value:yyyy-MM-dd}."
                : $"The document '{doc.FileName}' expired {Math.Abs(remainingDays)} day(s) ago on {doc.ExpiryDate.Value:yyyy-MM-dd}.";

            var context = new NotificationDispatchContext
            {
                Type = NotificationType.DocumentExpiry,
                Audience = audience,
                Title = title,
                Message = message,
                TargetDate = doc.ExpiryDate,
                RemainingDays = remainingDays,
                EntityReferenceId = doc.Id,
                EntityReferenceType = "Document",
                PayloadJson = System.Text.Json.JsonSerializer.Serialize(new
                {
                    doc.FileName,
                    doc.DocumentType,
                    ExpiryDate = doc.ExpiryDate.Value.ToString("yyyy-MM-dd")
                })
            };

            var created = await _dispatcher.DispatchAsync(context, cancellationToken);
            dispatchedCount += created;
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

        var now = DateTime.UtcNow;
        var currentYear = now.Year;
        var currentMonth = now.Month;

        var oneDayAgo = DateTime.UtcNow.AddHours(-24);
        var alreadyNotifiedToday = await _context.UserNotifications
            .AnyAsync(n => n.Type == NotificationType.FinanceAlert && n.CreatedAt >= oneDayAgo, cancellationToken);

        if (alreadyNotifiedToday)
        {
            return 0;
        }

        var activeEmployeesCount = await _context.Employees
            .CountAsync(e => e.EmploymentStatus == Domain.Enums.EmploymentStatus.Active && !e.IsDeleted, cancellationToken);

        var lockedTimesheetsCount = await _context.MonthlyTimesheets
            .CountAsync(t => t.Year == currentYear && t.Month == currentMonth && t.IsLocked, cancellationToken);

        var pendingCount = activeEmployeesCount - lockedTimesheetsCount;
        if (pendingCount <= 0)
        {
            return 0;
        }

        var endOfMonth = new DateTime(currentYear, currentMonth, DateTime.DaysInMonth(currentYear, currentMonth));
        var remainingDays = (int)(endOfMonth.Date - now.Date).TotalDays;

        var periodName = new DateTime(currentYear, currentMonth, 1).ToString("MMMM yyyy");
        var title = $"Missing Timesheets Alert: {pendingCount} Pending";
        var message = $"{pendingCount} active employee timesheet(s) are unsubmitted or unlocked for period {periodName}.";

        var context = new NotificationDispatchContext
        {
            Type = NotificationType.FinanceAlert,
            Audience = TargetAudience.ForAllUsers(),
            Title = title,
            Message = message,
            TargetDate = endOfMonth,
            RemainingDays = remainingDays,
            EntityReferenceType = "Timesheet",
            PayloadJson = System.Text.Json.JsonSerializer.Serialize(new
            {
                Year = currentYear,
                Month = currentMonth,
                Period = periodName,
                PendingCount = pendingCount
            })
        };

        return await _dispatcher.DispatchAsync(context, cancellationToken);
    }
}
