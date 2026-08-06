namespace SoftPMS.Application.Features.SystemSettings.DTOs;

/// <summary>
/// DTO representing an individual entity mutation entry within a correlated audit log transaction.
/// </summary>
public sealed class AuditLogItemDto
{
    public long Id { get; set; }
    public string TableName { get; set; } = string.Empty;
    public string RecordId { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public bool IsEntityActive { get; set; }
    public string? NavigationRoute { get; set; }
    public string EntityTitle { get; set; } = string.Empty;
    public DateTime ChangedAt { get; set; }
    public List<AuditLogChangeDto> Changes { get; set; } = [];
}
