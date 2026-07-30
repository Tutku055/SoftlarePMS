namespace SoftPMS.Domain.Entities;

public class YearlyRolloverLog : BaseEntity
{
    public int YearClosed { get; set; }
    public DateTime ClosedAt { get; set; }
}
