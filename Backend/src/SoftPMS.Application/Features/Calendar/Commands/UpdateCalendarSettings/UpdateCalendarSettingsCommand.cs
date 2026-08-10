using MediatR;
using Microsoft.EntityFrameworkCore;
using SoftPMS.Application.Common.Interfaces;
using SoftPMS.Domain.Entities;

namespace SoftPMS.Application.Features.Calendar.Commands.UpdateCalendarSettings;

public record UpdateCalendarSettingsCommand(
    string HolidayCountryCode,
    int HolidayReminderDays,
    bool SendEmailForHolidays,
    int BirthdayReminderDays,
    bool SendEmailForBirthdays,
    int CompanyTimezoneOffsetMinutes
) : IRequest<Unit>;

