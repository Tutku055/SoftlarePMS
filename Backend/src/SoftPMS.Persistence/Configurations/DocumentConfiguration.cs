using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SoftPMS.Domain.Entities;

namespace SoftPMS.Persistence.Configurations;

public class DocumentConfiguration : IEntityTypeConfiguration<Document>
{
    public void Configure(EntityTypeBuilder<Document> builder)
    {
        builder.HasKey(d => d.Id);

        builder.Property(d => d.FileName)
            .IsRequired()
            .HasMaxLength(255);

        builder.Property(d => d.FilePath)
            .IsRequired()
            .HasMaxLength(500);

        builder.Property(d => d.DocumentType)
            .HasConversion<int>()
            .IsRequired();

        builder.Property(d => d.OwnerModule)
            .HasConversion<int>()
            .IsRequired();

        builder.Property(d => d.IsAvailable)
            .IsRequired()
            .HasDefaultValue(true);

        builder.Property(d => d.LastCheckedAt)
            .IsRequired(false);

        // FK to creating User — restrict to prevent cascade on user removal
        builder.HasOne(d => d.CreatedByUser)
            .WithMany(u => u.CreatedDocuments)
            .HasForeignKey(d => d.CreatedByUserId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.Restrict);

        // Remove the soft delete filter since ReferenceId can belong to any entity,
        // or apply it carefully. For now, just rely on standard queries.
    }
}
