namespace SoftPMS.Domain.Entities;

public class Profession : BaseEntity
{
    public string Name { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public bool IsActive { get; set; } = true;

    public bool IsDeleted { get; set; } = false;

    // Navigation property
    public virtual ICollection<Employee> Employees { get; set; } = new HashSet<Employee>();
}
