using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SoftPMS.Domain.Entities;

namespace SoftPMS.Persistence.Configurations;

public class NotificationOutboxConfiguration : IEntityTypeConfiguration<NotificationOutbox>
{
    public void Configure(EntityTypeBuilder<NotificationOutbox> builder)
    {
        builder.ToTable("NotificationOutboxes");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.RecipientEmail)
            .IsRequired()
            .HasMaxLength(256);

        builder.Property(x => x.RecipientName)
            .IsRequired(false)
            .HasMaxLength(150);

        builder.Property(x => x.Subject)
            .IsRequired()
            .HasMaxLength(300);

        builder.Property(x => x.BodyHtml)
            .IsRequired();

        builder.Property(x => x.Status)
            .IsRequired();

        builder.Property(x => x.RetryCount)
            .IsRequired()
            .HasDefaultValue(0);

        builder.Property(x => x.MaxRetries)
            .IsRequired()
            .HasDefaultValue(3);

        builder.Property(x => x.NextRetryAtUtc)
            .IsRequired(false);

        builder.Property(x => x.ProcessedAtUtc)
            .IsRequired(false);

        builder.Property(x => x.ErrorMessage)
            .IsRequired(false)
            .HasMaxLength(4000);

        builder.Property(x => x.NotificationId)
            .IsRequired(false);

        builder.Property(x => x.CreatedAt)
            .IsRequired();

        // Optimized Composite Index for Worker Polling queries:
        // WHERE (Status = Pending OR (Status = Failed AND RetryCount < MaxRetries)) AND (NextRetryAtUtc IS NULL OR NextRetryAtUtc <= @now)
        builder.HasIndex(x => new { x.Status, x.NextRetryAtUtc, x.RetryCount })
            .HasDatabaseName("IX_NotificationOutboxes_Status_NextRetry_RetryCount");

        // Index for FIFO batch ordering and historical archival
        builder.HasIndex(x => x.CreatedAt)
            .HasDatabaseName("IX_NotificationOutboxes_CreatedAt");
    }
}
