using PublicHoliday;
using SoftPMS.Application.Common.Interfaces;

namespace SoftPMS.Infrastructure.Services;

public class PublicHolidayService : IPublicHolidayService
{
    public IList<HolidayItem> GetHolidays(int year, string countryCode = "TR")
    {
        IPublicHolidays holidaysProvider = countryCode.ToUpperInvariant() switch
        {
            "TR" => new TurkeyPublicHoliday(),
            "US" or "USA" => new USAPublicHoliday(),
            "UK" or "GB" => new UKBankHoliday(),
            "DE" => new GermanPublicHoliday(),
            "FR" => new FrancePublicHoliday(),
            "CA" => new CanadaPublicHoliday(),
            "AU" => new AustraliaPublicHoliday(),
            "IT" => new ItalyPublicHoliday(),
            "ES" => new SpainPublicHoliday(),
            "NL" => new DutchPublicHoliday(),
            "JP" => new JapanPublicHoliday(),
            "PL" => new PolandPublicHoliday(),
            "SE" => new SwedenPublicHoliday(),
            "NO" => new NorwayPublicHoliday(),
            "CH" => new SwitzerlandPublicHoliday(),
            "BE" => new BelgiumPublicHoliday(),
            "AT" => new AustriaPublicHoliday(),
            "NZ" => new NewZealandPublicHoliday(),
            "IE" => new IrelandPublicHoliday(),
            "DK" => new DenmarkPublicHoliday(),
            _ => new TurkeyPublicHoliday()
        };

        var holidayNames = holidaysProvider.PublicHolidayNames(year);
        var result = new List<HolidayItem>(holidayNames.Count);

        foreach (var kv in holidayNames)
        {
            result.Add(new HolidayItem(DateOnly.FromDateTime(kv.Key), kv.Value));
        }

        return result.OrderBy(h => h.Date).ToList();
    }
}
