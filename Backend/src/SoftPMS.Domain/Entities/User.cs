namespace SoftPMS.Domain.Entities;

public class User : BaseEntity
{
    public Guid? EmployeeId { get; set; }

    public string Username { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public string PasswordHash { get; set; } = string.Empty;

    public bool IsActive { get; set; } = true;

    public string? RefreshToken { get; set; }

    public DateTime? RefreshTokenExpiryTime { get; set; }

    public string? PasswordResetToken { get; set; }

    public DateTime? PasswordResetTokenExpiryTime { get; set; }

    public bool RequiresPasswordChange { get; set; } = true;

    public bool IsSystemUser { get; set; } = false;

    public Guid RoleId { get; set; }

    // Navigation properties
    public virtual Employee? Employee { get; set; }

    public virtual Role Role { get; set; } = null!;

    public virtual ICollection<Employee> CreatedEmployees { get; set; } = new HashSet<Employee>();

    public virtual ICollection<EmployeeCompensation> CreatedCompensations { get; set; } = new HashSet<EmployeeCompensation>();

    public virtual ICollection<Document> CreatedDocuments { get; set; } = new HashSet<Document>();

    public virtual ICollection<EmployeeNote> CreatedNotes { get; set; } = new HashSet<EmployeeNote>();

    public virtual ICollection<UserNotification> Notifications { get; set; } = new HashSet<UserNotification>();

    public bool IsDeleted { get; set; } = false;
}

