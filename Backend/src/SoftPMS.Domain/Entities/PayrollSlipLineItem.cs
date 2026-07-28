using SoftPMS.Domain.Enums;

namespace SoftPMS.Domain.Entities;

public class PayrollSlipLineItem : BaseEntity
{
    public Guid PayrollSlipId { get; set; }
    
    public SlipItemType ItemType { get; set; }
    
    public string Description { get; set; } = string.Empty;
    
    public decimal Amount { get; set; }

    public virtual PayrollSlip PayrollSlip { get; set; } = null!;
}
