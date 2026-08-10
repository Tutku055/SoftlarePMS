using MediatR;
using Microsoft.EntityFrameworkCore;
using SoftPMS.Application.Common.Interfaces;
using SoftPMS.Domain.Entities;

namespace SoftPMS.Application.Features.Calendar.Commands.UpdateCalendarSettings;

public class UpdateCalendarSettingsCommandHandler : IRequestHandler<UpdateCalendarSettingsCommand, Unit>
{
    private readonly IApplicationDbContext _context;

    public UpdateCalendarSettingsCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Unit> Handle(UpdateCalendarSettingsCommand request, CancellationToken cancellationToken)
    {
        var setting = await _context.CalendarSettings
            .FirstOrDefaultAsync(cancellationToken);

        if (setting == null)
        {
            setting = new CalendarSetting
            {
                HolidayCountryCode = request.HolidayCountryCode.Trim().ToUpperInvariant(),
                HolidayReminderDays = request.HolidayReminderDays,
                SendEmailForHolidays = request.SendEmailForHolidays,
                BirthdayReminderDays = request.BirthdayReminderDays,
                SendEmailForBirthdays = request.SendEmailForBirthdays,
                CompanyTimezoneOffsetMinutes = request.CompanyTimezoneOffsetMinutes,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _context.CalendarSettings.Add(setting);
        }
        else
        {
            setting.HolidayCountryCode = request.HolidayCountryCode.Trim().ToUpperInvariant();
            setting.HolidayReminderDays = request.HolidayReminderDays;
            setting.SendEmailForHolidays = request.SendEmailForHolidays;
            setting.BirthdayReminderDays = request.BirthdayReminderDays;
            setting.SendEmailForBirthdays = request.SendEmailForBirthdays;
            setting.CompanyTimezoneOffsetMinutes = request.CompanyTimezoneOffsetMinutes;
            setting.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync(cancellationToken);

        return Unit.Value;
    }
}
