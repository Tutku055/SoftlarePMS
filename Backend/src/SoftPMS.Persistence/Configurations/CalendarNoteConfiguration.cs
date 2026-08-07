using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SoftPMS.Domain.Entities;

namespace SoftPMS.Persistence.Configurations;

public class CalendarNoteConfiguration : IEntityTypeConfiguration<CalendarNote>
{
    public void Configure(EntityTypeBuilder<CalendarNote> builder)
    {
        builder.ToTable("CalendarNotes");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.UserId)
            .IsRequired();

        builder.Property(x => x.NoteDate)
            .IsRequired();

        builder.Property(x => x.Content)
            .IsRequired()
            .HasMaxLength(2000);

        builder.Property(x => x.ColorCode)
            .IsRequired()
            .HasMaxLength(30)
            .HasDefaultValue("#3B82F6");

        builder.Property(x => x.VisibilityLevel)
            .IsRequired();

        builder.Property(x => x.CreatedAt)
            .IsRequired();

        builder.HasOne(x => x.User)
            .WithMany()
            .HasForeignKey(x => x.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(x => new { x.NoteDate, x.UserId })
            .HasDatabaseName("IX_CalendarNotes_NoteDate_UserId");
    }
}
