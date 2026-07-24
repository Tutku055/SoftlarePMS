using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SoftPMS.Domain.Entities;

namespace SoftPMS.Persistence.Configurations;

public class EmployeeReferenceConfiguration : IEntityTypeConfiguration<EmployeeReference>
{
    public void Configure(EntityTypeBuilder<EmployeeReference> builder)
    {
        builder.HasKey(r => r.Id);

        builder.Property(r => r.CompanyName)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(r => r.ContactPerson)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(r => r.Title)
            .HasMaxLength(100);

        builder.Property(r => r.Relationship)
            .IsRequired()
            .HasConversion<int>();

        builder.Property(r => r.Phone)
            .HasMaxLength(50);

        builder.Property(r => r.Email)
            .HasMaxLength(150);

        builder.Property(r => r.Notes)
            .HasColumnType("nvarchar(max)");

        // FK to Employee — cascade when employee is hard-deleted
        builder.HasOne(r => r.Employee)
            .WithMany(e => e.References)
            .HasForeignKey(r => r.EmployeeId)
            .OnDelete(DeleteBehavior.Cascade);

        // Global query filter to match Employee soft delete
        builder.HasQueryFilter(r => !r.Employee.IsDeleted);
    }
}
