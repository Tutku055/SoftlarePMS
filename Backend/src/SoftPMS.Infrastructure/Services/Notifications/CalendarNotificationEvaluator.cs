using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using SoftPMS.Application.Common.Interfaces;
using SoftPMS.Application.Features.Notifications.Services;
using SoftPMS.Domain.Entities;
using SoftPMS.Domain.Enums;

namespace SoftPMS.Infrastructure.Services.Notifications;

public class CalendarNotificationEvaluator : ICalendarNotificationEvaluator
{
    private readonly IApplicationDbContext _context;
    private readonly IPublicHolidayService _publicHolidayService;
    private readonly INotificationEmailTemplateBuilder _templateBuilder;
    private readonly ILogger<CalendarNotificationEvaluator> _logger;

    public CalendarNotificationEvaluator(
        IApplicationDbContext context,
        IPublicHolidayService publicHolidayService,
        INotificationEmailTemplateBuilder templateBuilder,
        ILogger<CalendarNotificationEvaluator> logger)
    {
        _context = context;
        _publicHolidayService = publicHolidayService;
        _templateBuilder = templateBuilder;
        _logger = logger;
    }

    public async Task<int> EvaluateCalendarRemindersAsync(CancellationToken cancellationToken = default)
    {
        var dispatchedCount = 0;
        var nowUtc = DateTimeOffset.UtcNow;
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        // Fetch active users with employee and role details for in-app and email notifications
        var activeUsers = await _context.Users
            .Include(u => u.Employee)
            .Include(u => u.Role)
                .ThenInclude(r => r.RolePermissions)
                    .ThenInclude(rp => rp.Permission)
            .AsNoTracking()
            .Where(u => u.IsActive && !u.IsDeleted)
            .ToListAsync(cancellationToken);

        // Fetch active employees
        var activeEmployees = await _context.Employees
            .AsNoTracking()
            .Where(e => !e.IsDeleted && e.EmploymentStatus == EmploymentStatus.Active)
            .ToListAsync(cancellationToken);

        // Build unified recipient list deduplicated by email address with department info
        var emailRecipients = new Dictionary<string, (string Email, string Name, Guid? EmployeeId, Guid? DepartmentId)>(StringComparer.OrdinalIgnoreCase);

        foreach (var user in activeUsers)
        {
            var userEmail = !string.IsNullOrWhiteSpace(user.Email)
                ? user.Email.Trim()
                : user.Employee != null && !string.IsNullOrWhiteSpace(user.Employee.Email)
                    ? user.Employee.Email.Trim()
                    : null;

            if (!string.IsNullOrWhiteSpace(userEmail))
            {
                var name = user.Employee != null
                    ? $"{user.Employee.FirstName} {user.Employee.LastName}"
                    : user.Username;
                var deptId = user.Employee?.DepartmentId;
                emailRecipients[userEmail] = (userEmail, name, user.EmployeeId, deptId);
            }
        }

        foreach (var emp in activeEmployees.Where(e => !string.IsNullOrWhiteSpace(e.Email)))
        {
            var email = emp.Email.Trim();
            if (!emailRecipients.ContainsKey(email))
            {
                var name = $"{emp.FirstName} {emp.LastName}";
                emailRecipients[email] = (email, name, emp.Id, emp.DepartmentId);
            }
        }

        // Fetch calendar settings
        var settings = await _context.CalendarSettings
            .AsNoTracking()
            .FirstOrDefaultAsync(cancellationToken) ?? new CalendarSetting();

        // ─────────────────────────────────────────────────────────────────────────────
        // 1. PHYSICAL CALENDAR EVENTS
        // ─────────────────────────────────────────────────────────────────────────────
        var physicalEvents = await _context.CalendarEvents
            .AsNoTracking()
            .Where(e => e.EndTime >= nowUtc)
            .ToListAsync(cancellationToken);

        var todayUtcDate = nowUtc.UtcDateTime.Date;

        foreach (var evt in physicalEvents)
        {
            var reminderStartDate = evt.StartTime.UtcDateTime.Date.AddDays(-evt.ReminderThresholdDays);

            if (todayUtcDate >= reminderStartDate && nowUtc <= evt.EndTime)
            {
                var refKey = $"PHYS_EVENT_{evt.Id}_{evt.StartTime:yyyyMMdd}";
                var alreadySent = await _context.EventReminderTrackers
                    .AnyAsync(r => r.ReferenceKey == refKey, cancellationToken);

                if (!alreadySent)
                {
                    _context.EventReminderTrackers.Add(new EventReminderTracker
                    {
                        ReferenceKey = refKey,
                        SentAt = DateTime.UtcNow,
                        CreatedAt = DateTime.UtcNow
                    });

                    var remainingDays = Math.Max(0, (evt.StartTime.UtcDateTime.Date - todayUtcDate).Days);
                    var isConfidential = evt.VisibilityLevel == VisibilityLevel.Confidential;

                    // Filter target users for in-app notifications
                    var targetUsers = activeUsers.Where(u =>
                        !isConfidential ||
                        u.Id == evt.UserId ||
                        (u.Role != null && (u.Role.Name == "SuperAdmin" || u.Role.RolePermissions.Any(rp => rp.Permission.Name == "Calendar.ReadConfidentialEvents" || rp.Permission.Name == "SuperAdmin")))
                    ).ToList();

                    // Dispatch In-App notifications to target users
                    foreach (var user in targetUsers)
                    {
                        _context.UserNotifications.Add(new UserNotification
                        {
                            UserId = user.Id,
                            Type = NotificationType.EventUpcoming,
                            Title = $"Upcoming Event: {evt.Title}",
                            Message = string.IsNullOrWhiteSpace(evt.Description)
                                ? (remainingDays == 0
                                    ? $"Reminder for event '{evt.Title}' happening today at {evt.StartTime:HH:mm} UTC."
                                    : $"Reminder for event '{evt.Title}' in {remainingDays} day(s) on {evt.StartTime:yyyy-MM-dd HH:mm} UTC.")
                                : (remainingDays == 0
                                    ? $"Reminder for event '{evt.Title}' today: {evt.Description}"
                                    : $"Reminder for event '{evt.Title}' on {evt.StartTime:yyyy-MM-dd}: {evt.Description}"),
                            EntityReferenceId = evt.Id,
                            EntityReferenceType = "CalendarEvent",
                            DeliveryChannel = (!isConfidential && evt.SendEmailReminder) ? NotificationDeliveryChannel.SystemAndMail : NotificationDeliveryChannel.System,
                            TargetDate = evt.StartTime.UtcDateTime.Date,
                            RemainingDays = remainingDays,
                            IsRead = false,
                            CreatedAt = DateTime.UtcNow
                        });
                    }

                    // Dispatch Outbox emails only if NOT confidential and SendEmailReminder is enabled
                    if (!isConfidential && evt.SendEmailReminder)
                    {
                        var targetRecipients = emailRecipients.Values
                            .Where(r => !evt.DepartmentId.HasValue || (r.DepartmentId.HasValue && r.DepartmentId.Value == evt.DepartmentId.Value))
                            .ToList();

                        var sampleNotification = new UserNotification
                        {
                            Type = NotificationType.EventUpcoming,
                            Title = $"Upcoming Event: {evt.Title}",
                            Message = string.IsNullOrWhiteSpace(evt.Description)
                                ? (remainingDays == 0
                                    ? $"You have an event scheduled today: '{evt.Title}' at {evt.StartTime:HH:mm} UTC."
                                    : $"You have an upcoming event scheduled: '{evt.Title}' in {remainingDays} day(s) on {evt.StartTime:yyyy-MM-dd HH:mm} UTC.")
                                : $"You have an upcoming event: '{evt.Title}'. Details: {evt.Description}",
                            TargetDate = evt.StartTime.UtcDateTime.Date,
                            RemainingDays = remainingDays
                        };

                        foreach (var recipient in targetRecipients)
                        {
                            var htmlBody = _templateBuilder.BuildNotificationEmailHtml(sampleNotification, recipient.Name);
                            _context.NotificationOutboxes.Add(new NotificationOutbox
                            {
                                RecipientEmail = recipient.Email,
                                RecipientName = recipient.Name,
                                Subject = $"[Event Reminder] {evt.Title}",
                                BodyHtml = htmlBody,
                                Status = OutboxStatus.Pending,
                                RetryCount = 0,
                                MaxRetries = 3,
                                NextRetryAtUtc = DateTime.UtcNow,
                                CreatedAt = DateTime.UtcNow
                            });
                        }
                    }

                    dispatchedCount++;
                }
            }
        }

        // ─────────────────────────────────────────────────────────────────────────────
        // 2. VIRTUAL PUBLIC HOLIDAYS
        // ─────────────────────────────────────────────────────────────────────────────
        var holidayCountry = settings.HolidayCountryCode;
        var holidayReminderWindow = today.AddDays(settings.HolidayReminderDays);

        var currentYearHolidays = _publicHolidayService.GetHolidays(today.Year, holidayCountry);
        var upcomingHolidays = currentYearHolidays.Where(h => h.Date >= today && h.Date <= holidayReminderWindow).ToList();

        if (today.Month == 12 && holidayReminderWindow.Year > today.Year)
        {
            var nextYearHolidays = _publicHolidayService.GetHolidays(holidayReminderWindow.Year, holidayCountry);
            upcomingHolidays.AddRange(nextYearHolidays.Where(h => h.Date >= today && h.Date <= holidayReminderWindow));
        }

        foreach (var holiday in upcomingHolidays)
        {
            var refKey = $"HOL_{holiday.Date:yyyy-MM-dd}_{holidayCountry}";
            var alreadySent = await _context.EventReminderTrackers
                .AnyAsync(r => r.ReferenceKey == refKey, cancellationToken);

            if (!alreadySent)
            {
                _context.EventReminderTrackers.Add(new EventReminderTracker
                {
                    ReferenceKey = refKey,
                    SentAt = DateTime.UtcNow,
                    CreatedAt = DateTime.UtcNow
                });

                var remainingDays = holiday.Date.DayNumber - today.DayNumber;

                // Dispatch In-App notifications to active users
                foreach (var user in activeUsers)
                {
                    _context.UserNotifications.Add(new UserNotification
                    {
                        UserId = user.Id,
                        Type = NotificationType.EventUpcoming,
                        Title = $"Upcoming Holiday: {holiday.Name}",
                        Message = $"Upcoming public holiday '{holiday.Name}' ({holidayCountry}) on {holiday.Date:yyyy-MM-dd}.",
                        EntityReferenceType = "PublicHoliday",
                        DeliveryChannel = settings.SendEmailForHolidays ? NotificationDeliveryChannel.SystemAndMail : NotificationDeliveryChannel.System,
                        TargetDate = holiday.Date.ToDateTime(TimeOnly.MinValue),
                        RemainingDays = remainingDays,
                        IsRead = false,
                        CreatedAt = DateTime.UtcNow
                    });
                }

                // Dispatch Outbox emails to all active recipients if enabled
                if (settings.SendEmailForHolidays)
                {
                    var sampleNotification = new UserNotification
                    {
                        Type = NotificationType.EventUpcoming,
                        Title = $"Upcoming Holiday: {holiday.Name}",
                        Message = $"Upcoming public holiday '{holiday.Name}' on {holiday.Date:yyyy-MM-dd}.",
                        TargetDate = holiday.Date.ToDateTime(TimeOnly.MinValue),
                        RemainingDays = remainingDays
                    };

                    foreach (var recipient in emailRecipients.Values)
                    {
                        var htmlBody = _templateBuilder.BuildNotificationEmailHtml(sampleNotification, recipient.Name);
                        _context.NotificationOutboxes.Add(new NotificationOutbox
                        {
                            RecipientEmail = recipient.Email,
                            RecipientName = recipient.Name,
                            Subject = $"[Holiday Notice] {holiday.Name}",
                            BodyHtml = htmlBody,
                            Status = OutboxStatus.Pending,
                            RetryCount = 0,
                            MaxRetries = 3,
                            NextRetryAtUtc = DateTime.UtcNow,
                            CreatedAt = DateTime.UtcNow
                        });
                    }
                }

                dispatchedCount++;
            }
        }

        // ─────────────────────────────────────────────────────────────────────────────
        // 3. VIRTUAL EMPLOYEE BIRTHDAYS (DUAL-ROLE CELEBRANT & COLLEAGUE EMAILS)
        // ─────────────────────────────────────────────────────────────────────────────
        var birthdayReminderDays = settings.BirthdayReminderDays;
        var birthdayWindowEnd = today.AddDays(birthdayReminderDays);

        foreach (var emp in activeEmployees)
        {
            var birthDay = emp.DateOfBirth.Day;
            var birthMonth = emp.DateOfBirth.Month;

            // Handle Feb 29 for non-leap years
            if (birthMonth == 2 && birthDay == 29 && !DateTime.IsLeapYear(today.Year))
            {
                birthDay = 28;
            }

            var nextBirthday = new DateOnly(today.Year, birthMonth, birthDay);
            if (nextBirthday < today)
            {
                var nextYear = today.Year + 1;
                var nextYearDay = (birthMonth == 2 && birthDay == 29 && !DateTime.IsLeapYear(nextYear)) ? 28 : emp.DateOfBirth.Day;
                nextBirthday = new DateOnly(nextYear, birthMonth, nextYearDay);
            }

            if (nextBirthday >= today && nextBirthday <= birthdayWindowEnd)
            {
                var refKey = $"BDAY_{emp.Id}_{nextBirthday:yyyyMMdd}";
                var alreadySent = await _context.EventReminderTrackers
                    .AnyAsync(r => r.ReferenceKey == refKey, cancellationToken);

                if (!alreadySent)
                {
                    _context.EventReminderTrackers.Add(new EventReminderTracker
                    {
                        ReferenceKey = refKey,
                        SentAt = DateTime.UtcNow,
                        CreatedAt = DateTime.UtcNow
                    });

                    var remainingDays = nextBirthday.DayNumber - today.DayNumber;
                    var isTodayBirthday = (nextBirthday == today);

                    // Dispatch In-App notifications to active users
                    foreach (var user in activeUsers)
                    {
                        var isUserCelebrant = (user.EmployeeId.HasValue && user.EmployeeId.Value == emp.Id);
                        _context.UserNotifications.Add(new UserNotification
                        {
                            UserId = user.Id,
                            Type = NotificationType.EventUpcoming,
                            Title = isUserCelebrant
                                ? "🎉 Happy Birthday to You!"
                                : $"Upcoming Birthday: {emp.FirstName} {emp.LastName}",
                            Message = isUserCelebrant
                                ? "Happy Birthday! Wishing you a fantastic year filled with health, joy, and success!"
                                : $"{emp.FirstName} {emp.LastName}'s birthday is {(isTodayBirthday ? "today" : $"coming up on {nextBirthday:yyyy-MM-dd}")}!",
                            EntityReferenceId = emp.Id,
                            EntityReferenceType = "Birthday",
                            DeliveryChannel = settings.SendEmailForBirthdays ? NotificationDeliveryChannel.SystemAndMail : NotificationDeliveryChannel.System,
                            TargetDate = nextBirthday.ToDateTime(TimeOnly.MinValue),
                            RemainingDays = remainingDays,
                            IsRead = false,
                            CreatedAt = DateTime.UtcNow
                        });
                    }

                    // Dispatch Outbox emails if enabled
                    if (settings.SendEmailForBirthdays)
                    {
                        var celebrantEmail = !string.IsNullOrWhiteSpace(emp.Email) ? emp.Email.Trim() : null;
                        if (string.IsNullOrEmpty(celebrantEmail))
                        {
                            var linkedUser = activeUsers.FirstOrDefault(u => u.EmployeeId == emp.Id && !string.IsNullOrWhiteSpace(u.Email));
                            celebrantEmail = linkedUser?.Email.Trim();
                        }

                        // 1. Send Celebrant Birthday Card to the birthday person
                        if (!string.IsNullOrWhiteSpace(celebrantEmail))
                        {
                            var celebrantHtml = _templateBuilder.BuildBirthdayCelebrantEmailHtml(emp.FirstName);
                            _context.NotificationOutboxes.Add(new NotificationOutbox
                            {
                                RecipientEmail = celebrantEmail,
                                RecipientName = $"{emp.FirstName} {emp.LastName}",
                                Subject = $"🎉 Happy Birthday, {emp.FirstName}! Best Wishes from All of Us!",
                                BodyHtml = celebrantHtml,
                                Status = OutboxStatus.Pending,
                                RetryCount = 0,
                                MaxRetries = 3,
                                NextRetryAtUtc = DateTime.UtcNow,
                                CreatedAt = DateTime.UtcNow
                            });
                        }

                        // 2. Send Colleague Announcement Email to all other active colleagues
                        var colleagueCelebrantName = $"{emp.FirstName} {emp.LastName}";
                        foreach (var recipient in emailRecipients.Values)
                        {
                            // Skip sending colleague alert to the celebrant themselves
                            if (!string.IsNullOrWhiteSpace(celebrantEmail) &&
                                string.Equals(recipient.Email, celebrantEmail, StringComparison.OrdinalIgnoreCase))
                            {
                                continue;
                            }

                            if (recipient.EmployeeId.HasValue && recipient.EmployeeId.Value == emp.Id)
                            {
                                continue;
                            }

                            var colleagueHtml = _templateBuilder.BuildBirthdayColleagueAnnouncementEmailHtml(colleagueCelebrantName, recipient.Name);
                            _context.NotificationOutboxes.Add(new NotificationOutbox
                            {
                                RecipientEmail = recipient.Email,
                                RecipientName = recipient.Name,
                                Subject = isTodayBirthday
                                    ? $"🎂 Today is {colleagueCelebrantName}'s Birthday! Let's Celebrate!"
                                    : $"🎂 Upcoming Birthday: {colleagueCelebrantName} on {nextBirthday:MMMM dd}!",
                                BodyHtml = colleagueHtml,
                                Status = OutboxStatus.Pending,
                                RetryCount = 0,
                                MaxRetries = 3,
                                NextRetryAtUtc = DateTime.UtcNow,
                                CreatedAt = DateTime.UtcNow
                            });
                        }
                    }

                    dispatchedCount++;
                }
            }
        }

        if (dispatchedCount > 0)
        {
            await _context.SaveChangesAsync(cancellationToken);
            _logger.LogInformation("Calendar notification evaluator processed {Count} reminder milestone(s).", dispatchedCount);
        }

        return dispatchedCount;
    }
}
