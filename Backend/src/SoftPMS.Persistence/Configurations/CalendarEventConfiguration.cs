using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SoftPMS.Domain.Entities;

namespace SoftPMS.Persistence.Configurations;

public class CalendarEventConfiguration : IEntityTypeConfiguration<CalendarEvent>
{
    public void Configure(EntityTypeBuilder<CalendarEvent> builder)
    {
        builder.ToTable("CalendarEvents");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.Title)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(x => x.Description)
            .IsRequired(false)
            .HasMaxLength(2000);

        builder.Property(x => x.StartTime)
            .IsRequired();

        builder.Property(x => x.EndTime)
            .IsRequired();

        builder.Property(x => x.ReminderThresholdDays)
            .IsRequired()
            .HasDefaultValue(1);

        builder.Property(x => x.SendEmailReminder)
            .IsRequired()
            .HasDefaultValue(true);

        builder.Property(x => x.VisibilityLevel)
            .IsRequired();

        builder.Property(x => x.EventType)
            .IsRequired()
            .HasDefaultValue(SoftPMS.Domain.Enums.CalendarEventType.TimeBased);

        builder.Property(x => x.DepartmentId)
            .IsRequired(false);

        builder.Property(x => x.UserId)
            .IsRequired(false);

        builder.Property(x => x.CreatedAt)
            .IsRequired();

        builder.HasOne(x => x.Department)
            .WithMany()
            .HasForeignKey(x => x.DepartmentId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(x => x.User)
            .WithMany()
            .HasForeignKey(x => x.UserId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasIndex(x => new { x.StartTime, x.EndTime })
            .HasDatabaseName("IX_CalendarEvents_StartTime_EndTime");
    }
}
