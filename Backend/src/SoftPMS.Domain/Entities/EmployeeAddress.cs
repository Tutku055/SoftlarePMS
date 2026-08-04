namespace SoftPMS.Domain.Entities;

public class EmployeeAddress : BaseEntity
{
    public Guid EmployeeId { get; set; }

    public string AddressLine { get; set; } = string.Empty;

    public string PostalCode { get; set; } = string.Empty;

    public string City { get; set; } = string.Empty;

    public string State { get; set; } = string.Empty;

    public string Country { get; set; } = string.Empty;

    public bool IsPrimary { get; set; } = false;

    public DateTime StartDate { get; set; }

    public DateTime? EndDate { get; set; }

    public bool IsCurrent => EndDate == null || EndDate >= DateTime.UtcNow.Date;

    // Navigation properties
    public virtual Employee Employee { get; set; } = null!;
}

