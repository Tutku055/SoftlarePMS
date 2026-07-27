using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SoftPMS.Domain.Entities;

namespace SoftPMS.Persistence.Configurations;

public class MonthlyTimesheetConfiguration : IEntityTypeConfiguration<MonthlyTimesheet>
{
    public void Configure(EntityTypeBuilder<MonthlyTimesheet> builder)
    {
        builder.HasKey(t => t.Id);

        builder.Property(t => t.Year).IsRequired();
        builder.Property(t => t.Month).IsRequired();

        builder.Property(t => t.TotalWorkedDays)
            .HasColumnType("decimal(18,2)")
            .IsRequired();

        builder.Property(t => t.TotalOvertimeHours)
            .HasColumnType("decimal(18,2)")
            .IsRequired();

        builder.Property(t => t.TotalAbsentDays)
            .HasColumnType("decimal(18,2)")
            .IsRequired();

        builder.HasOne(t => t.Employee)
            .WithMany() // We don't have a navigation property in Employee, as requested not to modify it.
            .HasForeignKey(t => t.EmployeeId)
            .OnDelete(DeleteBehavior.Cascade); // Assuming if employee is deleted, timesheets go with them or handle softly.
        
        // Ensure only one MonthlyTimesheet per employee per year/month
        builder.HasIndex(t => new { t.EmployeeId, t.Year, t.Month }).IsUnique();
    }
}
