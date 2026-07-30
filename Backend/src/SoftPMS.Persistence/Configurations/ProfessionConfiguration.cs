using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SoftPMS.Domain.Entities;

namespace SoftPMS.Persistence.Configurations;

public class ProfessionConfiguration : IEntityTypeConfiguration<Profession>
{
    public void Configure(EntityTypeBuilder<Profession> builder)
    {
        builder.HasKey(p => p.Id);

        builder.Property(p => p.Name)
            .IsRequired()
            .HasMaxLength(150);

        builder.HasIndex(p => p.Name)
            .IsUnique()
            .HasDatabaseName("IX_Professions_Name");

        builder.Property(p => p.Description)
            .HasMaxLength(500);

        // Global soft-delete filter
        builder.HasQueryFilter(p => !p.IsDeleted);

        builder.HasMany(p => p.Employees)
            .WithOne(e => e.Profession)
            .HasForeignKey(e => e.ProfessionId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
