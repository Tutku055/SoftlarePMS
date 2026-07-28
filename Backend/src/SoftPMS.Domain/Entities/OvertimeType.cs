using SoftPMS.Domain.Enums;

namespace SoftPMS.Domain.Entities;

public class OvertimeType : BaseEntity
{
    public string Name { get; set; } = string.Empty;

    public decimal Multiplier { get; set; }

    public bool IsDeleted { get; set; } = false;
}
