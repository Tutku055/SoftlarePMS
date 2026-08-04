using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SoftPMS.Domain.Entities;

namespace SoftPMS.Persistence.Configurations;

public class PayrollSlipLineItemConfiguration : IEntityTypeConfiguration<PayrollSlipLineItem>
{
    public void Configure(EntityTypeBuilder<PayrollSlipLineItem> builder)
    {
        builder.ToTable("PayrollSlipLineItems");

        builder.HasKey(p => p.Id);

        builder.Property(p => p.Description)
            .IsRequired()
            .HasMaxLength(255);

        builder.Property(p => p.Amount)
            .HasColumnType("decimal(18,2)");

        builder.Property(p => p.Currency)
            .HasConversion<string>()
            .IsRequired();

        builder.HasOne(p => p.PayrollSlip)
            .WithMany(s => s.LineItems)
            .HasForeignKey(p => p.PayrollSlipId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
