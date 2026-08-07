using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SoftPMS.Domain.Entities;

namespace SoftPMS.Persistence.Configurations;

public class CalendarSettingConfiguration : IEntityTypeConfiguration<CalendarSetting>
{
    public void Configure(EntityTypeBuilder<CalendarSetting> builder)
    {
        builder.ToTable("CalendarSettings");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.HolidayCountryCode)
            .IsRequired()
            .HasMaxLength(10)
            .HasDefaultValue("TR");

        builder.Property(x => x.HolidayReminderDays)
            .IsRequired()
            .HasDefaultValue(3);

        builder.Property(x => x.SendEmailForHolidays)
            .IsRequired()
            .HasDefaultValue(true);

        builder.Property(x => x.BirthdayReminderDays)
            .IsRequired()
            .HasDefaultValue(1);

        builder.Property(x => x.SendEmailForBirthdays)
            .IsRequired()
            .HasDefaultValue(true);

        builder.Property(x => x.UpdatedAt)
            .IsRequired(false);

        builder.Property(x => x.CreatedAt)
            .IsRequired();
    }
}
