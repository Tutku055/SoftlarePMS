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

        builder.Property(c => c.Currency)
            .HasConversion<string>()
            .IsRequired();


        builder.Property(c => c.EffectiveDate)
            .IsRequired();

        // Index on EmployeeId for faster lookups (1-to-Many)
        builder.HasIndex(c => c.EmployeeId)
            .HasDatabaseName("IX_EmployeeCompensations_EmployeeId");

        // Explicit 1-to-Many relation
        builder.HasOne(c => c.Employee)
            .WithMany(e => e.Compensations)
            .HasForeignKey(c => c.EmployeeId)
            .OnDelete(DeleteBehavior.Cascade);

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
