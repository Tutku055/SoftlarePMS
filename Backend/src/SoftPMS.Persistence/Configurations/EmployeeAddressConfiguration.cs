using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SoftPMS.Domain.Entities;

namespace SoftPMS.Persistence.Configurations;

public class EmployeeAddressConfiguration : IEntityTypeConfiguration<EmployeeAddress>
{
    public void Configure(EntityTypeBuilder<EmployeeAddress> builder)
    {
        builder.HasKey(a => a.Id);

        builder.Property(a => a.AddressLine)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(a => a.City)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(a => a.State)
            .HasMaxLength(100);

        builder.Property(a => a.Country)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(a => a.PostalCode)
            .HasMaxLength(20);

        builder.Property(a => a.StartDate)
            .IsRequired();

        builder.Property(a => a.EndDate)
            .IsRequired(false);

        builder.Property(a => a.IsPrimary)
            .IsRequired()
            .HasDefaultValue(false);

        builder.Ignore(a => a.IsCurrent);

        builder.HasIndex(a => a.EmployeeId);
        builder.HasIndex(a => new { a.EmployeeId, a.EndDate });
        builder.HasIndex(a => new { a.EmployeeId, a.IsPrimary });
        builder.HasIndex(a => a.StartDate);

        // Global query filter to match Employee soft delete
        builder.HasQueryFilter(a => !a.Employee.IsDeleted);
    }
}
