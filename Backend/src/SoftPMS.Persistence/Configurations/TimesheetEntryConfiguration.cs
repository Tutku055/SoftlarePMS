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
            .HasColumnType("decimal(18,2)");
            
        builder.Property(e => e.WorkedHours)
            .HasColumnType("decimal(18,2)");
            
        builder.Property(e => e.PaidLeaveHours)
            .HasColumnType("decimal(18,2)");
            
        builder.Property(e => e.UnpaidLeaveHours)
            .HasColumnType("decimal(18,2)");

        // Relationships

        builder.HasOne(e => e.MonthlyTimesheet)
            .WithMany(t => t.Entries)
            .HasForeignKey(e => e.MonthlyTimesheetId)
            .OnDelete(DeleteBehavior.Cascade);
            
        builder.HasOne(e => e.OvertimeType)
            .WithMany()
            .HasForeignKey(e => e.OvertimeTypeId)
            .OnDelete(DeleteBehavior.Restrict);
            
        builder.HasIndex(e => new { e.MonthlyTimesheetId, e.Date }).IsUnique();
    }
}
