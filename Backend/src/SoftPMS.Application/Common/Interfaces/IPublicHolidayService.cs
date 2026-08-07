namespace SoftPMS.Application.Common.Interfaces;

public record HolidayItem(DateOnly Date, string Name);

public interface IPublicHolidayService
{
    IList<HolidayItem> GetHolidays(int year, string countryCode = "TR");
}
