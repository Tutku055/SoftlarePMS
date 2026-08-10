using MediatR;
using Microsoft.EntityFrameworkCore;
using SoftPMS.Application.Common.Interfaces;
using SoftPMS.Application.Features.Calendar.DTOs;

namespace SoftPMS.Application.Features.Calendar.Queries.GetCalendarSettings;

public class GetCalendarSettingsQueryHandler : IRequestHandler<GetCalendarSettingsQuery, CalendarSettingsDto>
{
    private readonly IApplicationDbContext _context;

    public GetCalendarSettingsQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<CalendarSettingsDto> Handle(GetCalendarSettingsQuery request, CancellationToken cancellationToken)
    {
        var setting = await _context.CalendarSettings
            .AsNoTracking()
            .FirstOrDefaultAsync(cancellationToken);

        if (setting == null)
        {
            return new CalendarSettingsDto();
        }

        return new CalendarSettingsDto
        {
            HolidayCountryCode = setting.HolidayCountryCode,
            HolidayReminderDays = setting.HolidayReminderDays,
            SendEmailForHolidays = setting.SendEmailForHolidays,
            BirthdayReminderDays = setting.BirthdayReminderDays,
            SendEmailForBirthdays = setting.SendEmailForBirthdays
        };
    }
}
