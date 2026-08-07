using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SoftPMS.Domain.Entities;

namespace SoftPMS.Persistence.Configurations;

public class EventReminderTrackerConfiguration : IEntityTypeConfiguration<EventReminderTracker>
{
    public void Configure(EntityTypeBuilder<EventReminderTracker> builder)
    {
        builder.ToTable("EventReminderTrackers");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.ReferenceKey)
            .IsRequired()
            .HasMaxLength(250);

        builder.Property(x => x.SentAt)
            .IsRequired();

        builder.Property(x => x.CreatedAt)
            .IsRequired();

        builder.HasIndex(x => x.ReferenceKey)
            .IsUnique()
            .HasDatabaseName("IX_EventReminderTrackers_ReferenceKey");
    }
}
