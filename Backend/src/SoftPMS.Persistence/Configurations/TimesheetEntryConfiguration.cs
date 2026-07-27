using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SoftPMS.Domain.Entities;

namespace SoftPMS.Persistence.Configurations;

public class TimesheetEntryConfiguration : IEntityTypeConfiguration<TimesheetEntry>
{
    public void Configure(EntityTypeBuilder<TimesheetEntry> builder)
    {
        builder.HasKey(e => e.Id);

        builder.Property(e => e.Date).IsRequired();

        builder.Property(e => e.Status)
            .HasConversion<int>()
            .IsRequired();

        builder.Property(e => e.OvertimeHours)
            .HasColumnType("decimal(18,2)")
            .IsRequired();

        builder.HasOne(e => e.MonthlyTimesheet)
            .WithMany(t => t.Entries)
            .HasForeignKey(e => e.MonthlyTimesheetId)
            .OnDelete(DeleteBehavior.Cascade);
            
        builder.HasIndex(e => new { e.MonthlyTimesheetId, e.Date }).IsUnique();
    }
}
