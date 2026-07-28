using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SoftPMS.Domain.Entities;

namespace SoftPMS.Persistence.Configurations;

public class PayrollSlipConfiguration : IEntityTypeConfiguration<PayrollSlip>
{
    public void Configure(EntityTypeBuilder<PayrollSlip> builder)
    {
        builder.HasKey(p => p.Id);

        builder.Property(p => p.Year).IsRequired();
        builder.Property(p => p.Month).IsRequired();

        builder.Property(p => p.BaseSalary)
            .HasMaxLength(255)
            .IsRequired();

        builder.Property(p => p.TotalEarnings)
            .HasMaxLength(500)
            .IsRequired();

        builder.Property(p => p.TotalDeductions)
            .HasMaxLength(500)
            .IsRequired();

        builder.Property(p => p.NetSalary)
            .HasMaxLength(500)
            .IsRequired();

        builder.Property(p => p.IssueDate)
            .IsRequired();

        builder.HasOne(p => p.Employee)
            .WithMany() 
            .HasForeignKey(p => p.EmployeeId)
            .OnDelete(DeleteBehavior.Cascade);
            
        builder.HasIndex(p => new { p.EmployeeId, p.Year, p.Month }).IsUnique();
    }
}
