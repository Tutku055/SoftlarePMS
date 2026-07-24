using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SoftPMS.Domain.Entities;

namespace SoftPMS.Persistence.Configurations;

public class EmployeeCompensationConfiguration : IEntityTypeConfiguration<EmployeeCompensation>
{
    public void Configure(EntityTypeBuilder<EmployeeCompensation> builder)
    {
        builder.HasKey(c => c.Id);

        // Decimal precision for monetary values — 18 digits total, 2 decimal places
        builder.Property(c => c.BaseSalary)
            .HasColumnType("decimal(18,2)")
            .IsRequired();

        builder.Property(c => c.SalaryType)
            .HasConversion<int>()
            .IsRequired();

        builder.Property(c => c.PayGrade)
            .HasMaxLength(50);

        builder.Property(c => c.EffectiveDate)
            .IsRequired();

        // EndDate is null when this is the currently active rate
        builder.Property(c => c.EndDate)
            .IsRequired(false);

        // Composite index on (EmployeeId, EndDate) for fast "active rate" lookups
        builder.HasIndex(c => new { c.EmployeeId, c.EndDate })
            .HasDatabaseName("IX_EmployeeCompensations_EmployeeId_EndDate");

        // FK to creating User — restrict to avoid accidental cascade
        builder.HasOne(c => c.CreatedByUser)
            .WithMany(u => u.CreatedCompensations)
            .HasForeignKey(c => c.CreatedByUserId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.Restrict);

        // Global query filter to match Employee soft delete
        builder.HasQueryFilter(c => !c.Employee.IsDeleted);
    }
}
