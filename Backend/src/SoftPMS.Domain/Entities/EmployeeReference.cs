using SoftPMS.Domain.Enums;

namespace SoftPMS.Domain.Entities;

public class EmployeeReference: BaseEntity
{
    public Guid EmployeeId { get; set; }

    public string CompanyName { get; set; } = string.Empty;

    public string ContactPerson { get; set; } = string.Empty;

    public string Title { get; set; } = string.Empty;

    public ReferenceRelationship Relationship { get; set; } = ReferenceRelationship.Other;

    public string Phone { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public string Notes { get; set; } = string.Empty;

    // Navigation properties
    public virtual Employee Employee { get; set; } = null!;
}
