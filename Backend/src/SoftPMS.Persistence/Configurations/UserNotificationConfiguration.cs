using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SoftPMS.Domain.Entities;

namespace SoftPMS.Persistence.Configurations;

public class UserNotificationConfiguration : IEntityTypeConfiguration<UserNotification>
{
    public void Configure(EntityTypeBuilder<UserNotification> builder)
    {
        builder.ToTable("UserNotifications");

        builder.HasKey(n => n.Id);

        builder.Property(n => n.Title)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(n => n.Message)
            .IsRequired()
            .HasMaxLength(2000);

        builder.Property(n => n.Type)
            .IsRequired();

        builder.Property(n => n.DeliveryChannel)
            .IsRequired();

        builder.Property(n => n.IsRead)
            .IsRequired()
            .HasDefaultValue(false);

        builder.Property(n => n.EntityReferenceType)
            .IsRequired(false)
            .HasMaxLength(100);

        builder.Property(n => n.PayloadJson)
            .IsRequired(false);

        builder.Property(n => n.IsDeleted)
            .IsRequired()
            .HasDefaultValue(false);

        builder.Property(n => n.DeletedAt)
            .IsRequired(false);

        // Global query filter — soft deleted notifications are ignored across all queries
        builder.HasQueryFilter(n => !n.IsDeleted);

        // Foreign key to User
        builder.HasOne(n => n.User)
            .WithMany(u => u.Notifications)
            .HasForeignKey(n => n.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        // Optimized indexes for frequent queries
        builder.HasIndex(n => new { n.UserId, n.IsRead })
            .HasDatabaseName("IX_UserNotifications_UserId_IsRead");

        builder.HasIndex(n => new { n.UserId, n.CreatedAt })
            .HasDatabaseName("IX_UserNotifications_UserId_CreatedAt");

        builder.HasIndex(n => new { n.EntityReferenceId, n.Type })
            .HasDatabaseName("IX_UserNotifications_EntityReferenceId_Type");
    }
}
