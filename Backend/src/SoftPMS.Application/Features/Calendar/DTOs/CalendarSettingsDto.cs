namespace SoftPMS.Application.Features.Calendar.DTOs;

public class CalendarSettingsDto
{
    public string HolidayCountryCode { get; set; } = "TR";
    public int HolidayReminderDays { get; set; } = 3;
    public bool SendEmailForHolidays { get; set; } = true;
    public int BirthdayReminderDays { get; set; } = 1;
    public bool SendEmailForBirthdays { get; set; } = true;
}
