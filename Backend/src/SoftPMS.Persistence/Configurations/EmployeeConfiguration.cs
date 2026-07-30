using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SoftPMS.Domain.Entities;

namespace SoftPMS.Persistence.Configurations;

public class EmployeeConfiguration : IEntityTypeConfiguration<Employee>
{
    public void Configure(EntityTypeBuilder<Employee> builder)
    {
        builder.HasKey(e => e.Id);

        builder.Property(e => e.EmployeeNo)
            .IsRequired()
            .HasMaxLength(20);

        builder.HasIndex(e => e.EmployeeNo)
            .IsUnique()
            .HasDatabaseName("IX_Employees_EmployeeNo");

        builder.Property(e => e.FirstName)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(e => e.LastName)
            .IsRequired()
            .HasMaxLength(50);

        // Index on LastName/FirstName for the default sort used in the paginated list
        builder.HasIndex(e => new { e.LastName, e.FirstName })
            .HasDatabaseName("IX_Employees_LastName_FirstName");

        builder.Property(e => e.Nationality)
            .HasMaxLength(100);

        builder.Property(e => e.WorkingHoursPerWeek)
            .HasPrecision(5, 2);

        // FK: Profession
        builder.HasOne(e => e.Profession)
            .WithMany(p => p.Employees)
            .HasForeignKey(e => e.ProfessionId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Property(e => e.Gender)
            .HasConversion<int>()
            .IsRequired();

        builder.Property(e => e.EmploymentStatus)
            .HasConversion<int>()
            .IsRequired();

        // Index on EmploymentStatus for server-side filtering
        builder.HasIndex(e => e.EmploymentStatus)
            .HasDatabaseName("IX_Employees_EmploymentStatus");

        // Global soft-delete filter — IsDeleted employees are invisible to all queries
        builder.HasQueryFilter(e => !e.IsDeleted);

        // FK: employee was created by a User
        builder.HasOne(e => e.CreatedByUser)
            .WithMany(u => u.CreatedEmployees)
            .HasForeignKey(e => e.CreatedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        // FK: employee may be linked to a User account (optional)
        builder.HasOne(e => e.LinkedUser)
            .WithOne(u => u.Employee)
            .HasForeignKey<User>(u => u.EmployeeId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.SetNull);

        // One-to-many: Addresses, Compensations, Documents, Notes, References
        builder.HasMany(e => e.Addresses)
            .WithOne(a => a.Employee)
            .HasForeignKey(a => a.EmployeeId)
            .OnDelete(DeleteBehavior.Cascade);





        builder.HasMany(e => e.Notes)
            .WithOne(n => n.Employee)
            .HasForeignKey(n => n.EmployeeId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(e => e.References)
            .WithOne(r => r.Employee)
            .HasForeignKey(r => r.EmployeeId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
