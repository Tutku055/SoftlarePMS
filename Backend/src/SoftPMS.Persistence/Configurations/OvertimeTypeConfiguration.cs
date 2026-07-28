using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SoftPMS.Domain.Entities;

namespace SoftPMS.Persistence.Configurations;

public class OvertimeTypeConfiguration : IEntityTypeConfiguration<OvertimeType>
{
    public void Configure(EntityTypeBuilder<OvertimeType> builder)
    {
        builder.HasKey(e => e.Id);

        builder.Property(e => e.Name)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(e => e.Multiplier)
            .HasColumnType("decimal(18,2)")
            .IsRequired();
            
        builder.HasQueryFilter(e => !e.IsDeleted);
    }
}
