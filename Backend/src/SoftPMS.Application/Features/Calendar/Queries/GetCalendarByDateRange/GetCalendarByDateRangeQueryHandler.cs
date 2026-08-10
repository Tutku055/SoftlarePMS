using MediatR;
using Microsoft.EntityFrameworkCore;
using SoftPMS.Application.Common.Interfaces;
using SoftPMS.Application.Features.Calendar.DTOs;
using SoftPMS.Domain.Enums;

namespace SoftPMS.Application.Features.Calendar.Queries.GetCalendarByDateRange;

public class GetCalendarByDateRangeQueryHandler : IRequestHandler<GetCalendarByDateRangeQuery, List<CalendarDayDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly IPublicHolidayService _publicHolidayService;

    public GetCalendarByDateRangeQueryHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService,
        IPublicHolidayService publicHolidayService)
    {
        _context = context;
        _currentUserService = currentUserService;
        _publicHolidayService = publicHolidayService;
    }

    public async Task<List<CalendarDayDto>> Handle(GetCalendarByDateRangeQuery request, CancellationToken cancellationToken)
    {
        var tzOffsetMinutes = _currentUserService.TimezoneOffsetMinutes;
        var tzOffset = TimeSpan.FromMinutes(tzOffsetMinutes);

        var startDateTimeOffset = new DateTimeOffset(request.StartDate.ToDateTime(TimeOnly.MinValue).AddMinutes(tzOffsetMinutes), TimeSpan.Zero);
        var endDateTimeOffset = new DateTimeOffset(request.EndDate.AddDays(1).ToDateTime(TimeOnly.MinValue).AddMinutes(tzOffsetMinutes), TimeSpan.Zero);
        var todayLocal = DateOnly.FromDateTime(DateTime.UtcNow.AddMinutes(-tzOffsetMinutes));

        var userPermissions = _currentUserService.Permissions;
        var currentUserId = _currentUserService.UserId;
        var canReadConfidentialEvents = userPermissions.Contains("Calendar.ReadConfidentialEvents", StringComparer.OrdinalIgnoreCase) ||
                                        userPermissions.Contains("SuperAdmin", StringComparer.OrdinalIgnoreCase);

        // 1. Physical Events overlapping with the requested range with RBAC confidentiality check
        var eventsQuery = _context.CalendarEvents
            .Include(e => e.Department)
            .Include(e => e.User)
            .AsNoTracking()
            .Where(e => e.StartTime < endDateTimeOffset && e.EndTime >= startDateTimeOffset);

        if (!canReadConfidentialEvents)
        {
            eventsQuery = eventsQuery.Where(e => e.VisibilityLevel != VisibilityLevel.Confidential || e.UserId == currentUserId);
        }

        var rawEvents = await eventsQuery
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
            EventType = e.EventType,
            VisibilityLevel = e.VisibilityLevel,
            DepartmentId = e.DepartmentId,
            DepartmentName = e.Department != null ? e.Department.Name : null,
            UserId = e.UserId,
            AuthorName = e.User != null ? e.User.Username : null,
            CreatedAt = e.CreatedAt
        }).ToList();

        // 2. Calendar Notes for the requested range with RBAC confidentiality check
        var canReadConfidentialNotes = userPermissions.Contains("Calendar.ReadConfidentialNotes", StringComparer.OrdinalIgnoreCase) ||
                                       userPermissions.Contains("SuperAdmin", StringComparer.OrdinalIgnoreCase);

        var notesQuery = _context.CalendarNotes
            .Include(n => n.User)
            .AsNoTracking()
            .Where(n => n.NoteDate >= request.StartDate && n.NoteDate <= request.EndDate);

        if (!canReadConfidentialNotes)
        {
            notesQuery = notesQuery.Where(n => n.VisibilityLevel != VisibilityLevel.Confidential || n.UserId == currentUserId);
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
        var targetMonths = new List<int>();
        for(var d = request.StartDate; d <= request.EndDate; d = d.AddDays(1))
        {
            if (!targetMonths.Contains(d.Month)) targetMonths.Add(d.Month);
        }

        var birthdayEmployees = await _context.Employees
            .AsNoTracking()
            .Where(e => !e.IsDeleted && e.EmploymentStatus == EmploymentStatus.Active 
                     && e.DateOfBirth != null 
                     && targetMonths.Contains(e.DateOfBirth.Value.Month))
            .ToListAsync(cancellationToken);

        var birthdayVirtualEvents = new List<VirtualCalendarEventDto>();
        for (var y = request.StartDate.Year; y <= request.EndDate.Year; y++)
        {
            foreach (var emp in birthdayEmployees)
            {
                var birthDay = emp.DateOfBirth!.Value.Day;
                var birthMonth = emp.DateOfBirth!.Value.Month;

                if (birthMonth == 2 && birthDay == 29 && !DateTime.IsLeapYear(y))
                {
                    birthDay = 28;
                }

                var bdayDate = new DateOnly(y, birthMonth, birthDay);
                if (bdayDate >= request.StartDate && bdayDate <= request.EndDate)
                {
                    birthdayVirtualEvents.Add(new VirtualCalendarEventDto
                    {
                        Id = $"BDAY_{emp.Id}_{y}",
                        Title = $"🎂 {emp.FirstName} {emp.LastName}'s Birthday",
                        Description = $"Birthday celebration for {emp.FirstName} {emp.LastName} ({emp.EmployeeNo})",
                        Date = bdayDate,
                        Type = VirtualEventType.Birthday,
                        ReferenceId = emp.Id.ToString(),
                        ColorCode = "#EC4899"
                    });
                }
            }
        }

        // 4. Virtual Events: Public Holidays calculated on the fly
        var countryCode = await _context.CalendarSettings
            .AsNoTracking()
            .Select(s => s.HolidayCountryCode)
            .FirstOrDefaultAsync(cancellationToken) ?? "TR";

        var holidayVirtualEvents = new List<VirtualCalendarEventDto>();
        for (var y = request.StartDate.Year; y <= request.EndDate.Year; y++)
        {
            var holidaysForYear = _publicHolidayService.GetHolidays(y, countryCode);
            var filteredHolidays = holidaysForYear
                .Where(h => h.Date >= request.StartDate && h.Date <= request.EndDate)
                .Select(h => new VirtualCalendarEventDto
                {
                    Id = $"HOL_{h.Date:yyyy-MM-dd}_{countryCode}",
                    Title = $"🎉 {h.Name}",
                    Description = $"Public Holiday ({countryCode})",
                    Date = h.Date,
                    Type = VirtualEventType.Holiday,
                    ColorCode = "#10B981"
                });

            holidayVirtualEvents.AddRange(filteredHolidays);
        }

        var allVirtualEvents = holidayVirtualEvents.Concat(birthdayVirtualEvents).ToList();

        // 5. Merge all items grouped per day
        var totalDays = request.EndDate.DayNumber - request.StartDate.DayNumber + 1;
        var calendarDays = new List<CalendarDayDto>(totalDays);

        for (var i = 0; i < totalDays; i++)
        {
            var date = request.StartDate.AddDays(i);
            var dateStartUtc = new DateTimeOffset(date.ToDateTime(TimeOnly.MinValue).AddMinutes(tzOffsetMinutes), TimeSpan.Zero);
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
                IsToday = (date == todayLocal),
                Notes = dayNotes,
                PhysicalEvents = dayEvents,
                VirtualEvents = dayVirtual
            });
        }

        return calendarDays;
    }
}
