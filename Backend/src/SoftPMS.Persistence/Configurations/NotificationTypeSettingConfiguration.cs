using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SoftPMS.Domain.Entities;

namespace SoftPMS.Persistence.Configurations;

public class NotificationTypeSettingConfiguration : IEntityTypeConfiguration<NotificationTypeSetting>
{
    public void Configure(EntityTypeBuilder<NotificationTypeSetting> builder)
    {
        builder.ToTable("NotificationTypeSettings");

        builder.HasKey(s => s.Id);

        builder.Property(s => s.Type)
            .IsRequired();

        builder.HasIndex(s => s.Type)
            .IsUnique()
            .HasDatabaseName("IX_NotificationTypeSettings_Type");

        builder.Property(s => s.TypeName)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(s => s.Description)
            .IsRequired()
            .HasMaxLength(500);

        builder.Property(s => s.IsMuted)
            .IsRequired()
            .HasDefaultValue(false);

        builder.Property(s => s.ReminderDays)
            .IsRequired()
            .HasDefaultValue(7);

        builder.Property(s => s.DeliveryChannel)
            .IsRequired();
    }
}
