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

        // Fetch active users with employee details for in-app and email notifications
        var activeUsers = await _context.Users
            .Include(u => u.Employee)
            .AsNoTracking()
            .Where(u => u.IsActive && !u.IsDeleted)
            .ToListAsync(cancellationToken);

        var emailUsers = activeUsers
            .Where(u => !string.IsNullOrWhiteSpace(u.Email))
            .ToList();

        // Fetch active employees for birthdays
        var activeEmployees = await _context.Employees
            .AsNoTracking()
            .Where(e => !e.IsDeleted && e.EmploymentStatus == EmploymentStatus.Active)
            .ToListAsync(cancellationToken);

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

        foreach (var evt in physicalEvents)
        {
            var reminderThreshold = TimeSpan.FromDays(evt.ReminderThresholdDays);
            var reminderStartTime = evt.StartTime - reminderThreshold;

            if (nowUtc >= reminderStartTime && nowUtc <= evt.EndTime)
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

                    var remainingDays = (int)Math.Max(0, Math.Ceiling((evt.StartTime - nowUtc).TotalDays));

                    // Dispatch In-App notifications to active users
                    foreach (var user in activeUsers)
                    {
                        _context.UserNotifications.Add(new UserNotification
                        {
                            UserId = user.Id,
                            Type = NotificationType.EventUpcoming,
                            Title = $"Upcoming Event: {evt.Title}",
                            Message = string.IsNullOrWhiteSpace(evt.Description)
                                ? $"Reminder for event '{evt.Title}' starting at {evt.StartTime:yyyy-MM-dd HH:mm} UTC."
                                : $"Reminder for event '{evt.Title}': {evt.Description}",
                            EntityReferenceId = evt.Id,
                            EntityReferenceType = "CalendarEvent",
                            DeliveryChannel = evt.SendEmailReminder ? NotificationDeliveryChannel.SystemAndMail : NotificationDeliveryChannel.System,
                            TargetDate = evt.StartTime.UtcDateTime.Date,
                            RemainingDays = remainingDays,
                            IsRead = false,
                            CreatedAt = DateTime.UtcNow
                        });
                    }

                    // Dispatch Outbox emails to active users if enabled
                    if (evt.SendEmailReminder)
                    {
                        var sampleNotification = new UserNotification
                        {
                            Type = NotificationType.EventUpcoming,
                            Title = $"Upcoming Event: {evt.Title}",
                            Message = string.IsNullOrWhiteSpace(evt.Description)
                                ? $"You have an upcoming event scheduled: '{evt.Title}' on {evt.StartTime:yyyy-MM-dd HH:mm} UTC."
                                : $"You have an upcoming event: '{evt.Title}'. Details: {evt.Description}",
                            TargetDate = evt.StartTime.UtcDateTime.Date,
                            RemainingDays = remainingDays
                        };

                        foreach (var user in emailUsers)
                        {
                            var recipientName = user.Employee != null
                                ? $"{user.Employee.FirstName} {user.Employee.LastName}"
                                : user.Username;

                            var htmlBody = _templateBuilder.BuildNotificationEmailHtml(sampleNotification, recipientName);
                            _context.NotificationOutboxes.Add(new NotificationOutbox
                            {
                                RecipientEmail = user.Email.Trim(),
                                RecipientName = recipientName,
                                Subject = $"[Event Reminder] {evt.Title}",
                                BodyHtml = htmlBody,
                                Status = OutboxStatus.Pending,
                                RetryCount = 0,
                                MaxRetries = 3,
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

                // Dispatch Outbox emails to active users if enabled
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

                    foreach (var user in emailUsers)
                    {
                        var recipientName = user.Employee != null
                            ? $"{user.Employee.FirstName} {user.Employee.LastName}"
                            : user.Username;

                        var htmlBody = _templateBuilder.BuildNotificationEmailHtml(sampleNotification, recipientName);
                        _context.NotificationOutboxes.Add(new NotificationOutbox
                        {
                            RecipientEmail = user.Email.Trim(),
                            RecipientName = recipientName,
                            Subject = $"[Holiday Notice] {holiday.Name}",
                            BodyHtml = htmlBody,
                            Status = OutboxStatus.Pending,
                            RetryCount = 0,
                            MaxRetries = 3,
                            CreatedAt = DateTime.UtcNow
                        });
                    }
                }

                dispatchedCount++;
            }
        }

        // ─────────────────────────────────────────────────────────────────────────────
        // 3. VIRTUAL EMPLOYEE BIRTHDAYS
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

                    // Dispatch In-App notifications to active users
                    foreach (var user in activeUsers)
                    {
                        _context.UserNotifications.Add(new UserNotification
                        {
                            UserId = user.Id,
                            Type = NotificationType.EventUpcoming,
                            Title = $"Upcoming Birthday: {emp.FirstName} {emp.LastName}",
                            Message = $"{emp.FirstName} {emp.LastName}'s birthday is coming up on {nextBirthday:yyyy-MM-dd}!",
                            EntityReferenceId = emp.Id,
                            EntityReferenceType = "Birthday",
                            DeliveryChannel = settings.SendEmailForBirthdays ? NotificationDeliveryChannel.SystemAndMail : NotificationDeliveryChannel.System,
                            TargetDate = nextBirthday.ToDateTime(TimeOnly.MinValue),
                            RemainingDays = remainingDays,
                            IsRead = false,
                            CreatedAt = DateTime.UtcNow
                        });
                    }

                    // Dispatch Outbox emails to active users if enabled
                    if (settings.SendEmailForBirthdays)
                    {
                        var sampleNotification = new UserNotification
                        {
                            Type = NotificationType.EventUpcoming,
                            Title = $"Upcoming Birthday: {emp.FirstName} {emp.LastName}",
                            Message = $"Upcoming celebration: {emp.FirstName} {emp.LastName}'s birthday is on {nextBirthday:yyyy-MM-dd}!",
                            TargetDate = nextBirthday.ToDateTime(TimeOnly.MinValue),
                            RemainingDays = remainingDays
                        };

                        foreach (var user in emailUsers)
                        {
                            var recipientName = user.Employee != null
                                ? $"{user.Employee.FirstName} {user.Employee.LastName}"
                                : user.Username;

                            var htmlBody = _templateBuilder.BuildNotificationEmailHtml(sampleNotification, recipientName);
                            _context.NotificationOutboxes.Add(new NotificationOutbox
                            {
                                RecipientEmail = user.Email.Trim(),
                                RecipientName = recipientName,
                                Subject = $"[Birthday Reminder] {emp.FirstName} {emp.LastName}'s Birthday",
                                BodyHtml = htmlBody,
                                Status = OutboxStatus.Pending,
                                RetryCount = 0,
                                MaxRetries = 3,
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
