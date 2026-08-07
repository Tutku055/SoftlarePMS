using MediatR;
using Microsoft.EntityFrameworkCore;
using SoftPMS.Application.Common.Interfaces;
using SoftPMS.Application.Features.Calendar.DTOs;
using SoftPMS.Domain.Enums;

namespace SoftPMS.Application.Features.Calendar.Queries.GetMonthlyCalendar;

public class GetMonthlyCalendarQueryHandler : IRequestHandler<GetMonthlyCalendarQuery, List<CalendarDayDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly IPublicHolidayService _publicHolidayService;

    public GetMonthlyCalendarQueryHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService,
        IPublicHolidayService publicHolidayService)
    {
        _context = context;
        _currentUserService = currentUserService;
        _publicHolidayService = publicHolidayService;
    }

    public async Task<List<CalendarDayDto>> Handle(GetMonthlyCalendarQuery request, CancellationToken cancellationToken)
    {
        var startOfMonth = new DateTimeOffset(new DateTime(request.Year, request.Month, 1, 0, 0, 0, DateTimeKind.Utc));
        var daysInMonth = DateTime.DaysInMonth(request.Year, request.Month);
        var endOfMonth = startOfMonth.AddMonths(1);
        var todayUtc = DateOnly.FromDateTime(DateTime.UtcNow);

        // 1. Physical Events overlapping with the requested month
        var rawEvents = await _context.CalendarEvents
            .AsNoTracking()
            .Where(e => e.StartTime < endOfMonth && e.EndTime >= startOfMonth)
            .OrderBy(e => e.StartTime)
            .ToListAsync(cancellationToken);

        var physicalEventDtos = rawEvents.Select(e => new CalendarEventDto
        {
            Id = e.Id,
            Title = e.Title,
            Description = e.Description,
            StartTime = e.StartTime,
            EndTime = e.EndTime,
            ReminderThresholdDays = e.ReminderThresholdDays,
            SendEmailReminder = e.SendEmailReminder,
            CreatedAt = e.CreatedAt
        }).ToList();

        // 2. Calendar Notes for the requested month with RBAC confidentiality check
        var userPermissions = _currentUserService.Permissions;
        var canReadConfidential = userPermissions.Contains("Calendar.ReadConfidentialNotes") ||
                                  userPermissions.Contains("SuperAdmin");

        var notesQuery = _context.CalendarNotes
            .Include(n => n.User)
            .AsNoTracking()
            .Where(n => n.NoteDate.Year == request.Year && n.NoteDate.Month == request.Month);

        if (!canReadConfidential)
        {
            notesQuery = notesQuery.Where(n => n.VisibilityLevel != VisibilityLevel.Confidential);
        }

        var rawNotes = await notesQuery
            .OrderBy(n => n.CreatedAt)
            .ToListAsync(cancellationToken);

        var noteDtos = rawNotes.Select(n => new CalendarNoteDto
        {
            Id = n.Id,
            UserId = n.UserId,
            AuthorName = n.User != null ? n.User.Username : null,
            NoteDate = n.NoteDate,
            Content = n.Content,
            ColorCode = n.ColorCode,
            VisibilityLevel = n.VisibilityLevel,
            CreatedAt = n.CreatedAt
        }).ToList();

        // 3. Virtual Events: Employee Birthdays calculated on the fly
        var birthdayEmployees = await _context.Employees
            .AsNoTracking()
            .Where(e => !e.IsDeleted &&
                        e.EmploymentStatus == EmploymentStatus.Active &&
                        e.DateOfBirth.Month == request.Month)
            .ToListAsync(cancellationToken);

        var birthdayVirtualEvents = new List<VirtualCalendarEventDto>();
        foreach (var emp in birthdayEmployees)
        {
            var day = emp.DateOfBirth.Day;
            if (request.Month == 2 && day == 29 && !DateTime.IsLeapYear(request.Year))
            {
                day = 28;
            }

            var bdayDate = new DateOnly(request.Year, request.Month, day);
            birthdayVirtualEvents.Add(new VirtualCalendarEventDto
            {
                Id = $"BDAY_{emp.Id}_{request.Year}",
                Title = $"🎂 {emp.FirstName} {emp.LastName}'s Birthday",
                Description = $"Birthday celebration for {emp.FirstName} {emp.LastName} ({emp.EmployeeNo})",
                Date = bdayDate,
                Type = VirtualEventType.Birthday,
                ReferenceId = emp.Id.ToString(),
                ColorCode = "#EC4899"
            });
        }

        // 4. Virtual Events: Public Holidays calculated on the fly
        var countryCode = await _context.CalendarSettings
            .AsNoTracking()
            .Select(s => s.HolidayCountryCode)
            .FirstOrDefaultAsync(cancellationToken) ?? "TR";

        var allHolidays = _publicHolidayService.GetHolidays(request.Year, countryCode);
        var monthHolidays = allHolidays
            .Where(h => h.Date.Month == request.Month)
            .Select(h => new VirtualCalendarEventDto
            {
                Id = $"HOL_{h.Date:yyyy-MM-dd}_{countryCode}",
                Title = $"🎉 {h.Name}",
                Description = $"Public Holiday ({countryCode})",
                Date = h.Date,
                Type = VirtualEventType.Holiday,
                ColorCode = "#10B981"
            }).ToList();

        var allVirtualEvents = monthHolidays.Concat(birthdayVirtualEvents).ToList();

        // 5. Merge all items grouped per day
        var calendarDays = new List<CalendarDayDto>(daysInMonth);
        for (var day = 1; day <= daysInMonth; day++)
        {
            var date = new DateOnly(request.Year, request.Month, day);
            var dateStartUtc = new DateTimeOffset(new DateTime(request.Year, request.Month, day, 0, 0, 0, DateTimeKind.Utc));
            var dateEndUtc = dateStartUtc.AddDays(1);

            var dayEvents = physicalEventDtos
                .Where(e => e.StartTime < dateEndUtc && e.EndTime >= dateStartUtc)
                .ToList();

            var dayNotes = noteDtos
                .Where(n => n.NoteDate == date)
                .ToList();

            var dayVirtual = allVirtualEvents
                .Where(v => v.Date == date)
                .ToList();

            calendarDays.Add(new CalendarDayDto
            {
                Date = date,
                IsToday = (date == todayUtc),
                Notes = dayNotes,
                PhysicalEvents = dayEvents,
                VirtualEvents = dayVirtual
            });
        }

        return calendarDays;
    }
}
