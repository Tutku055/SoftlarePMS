namespace SoftPMS.Domain.Entities;

public class CalendarSetting : BaseEntity
{
    public string HolidayCountryCode { get; set; } = "TR";

    public int HolidayReminderDays { get; set; } = 3;

    public bool SendEmailForHolidays { get; set; } = true;

    public int BirthdayReminderDays { get; set; } = 1;

    public bool SendEmailForBirthdays { get; set; } = true;

    public DateTime? UpdatedAt { get; set; }
}
