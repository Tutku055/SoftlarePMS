using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SoftPMS.Domain.Entities;
using SoftPMS.Domain.Enums;

namespace SoftPMS.Persistence.Configurations;

public class EmployeeNoteConfiguration : IEntityTypeConfiguration<EmployeeNote>
{
    public void Configure(EntityTypeBuilder<EmployeeNote> builder)
    {
        builder.HasKey(n => n.Id);

        builder.Property(n => n.Title)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(n => n.Content)
            .IsRequired()
            .HasColumnType("nvarchar(max)");

        builder.Property(n => n.Category)
            .IsRequired()
            .HasConversion<int>();

        builder.Property(n => n.IsConfidential)
            .IsRequired()
            .HasDefaultValue(false);

        // FK to Employee — cascade delete removes notes when employee is hard-deleted
        builder.HasOne(n => n.Employee)
            .WithMany(e => e.Notes)
            .HasForeignKey(n => n.EmployeeId)
            .OnDelete(DeleteBehavior.Cascade);

        // FK to creating User — restrict to avoid accidental user deletion cascade
        builder.HasOne(n => n.CreatedByUser)
            .WithMany(u => u.CreatedNotes)
            .HasForeignKey(n => n.CreatedByUserId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.Restrict);

        // Global query filter to match Employee soft delete
        builder.HasQueryFilter(n => !n.Employee.IsDeleted);
    }
}
