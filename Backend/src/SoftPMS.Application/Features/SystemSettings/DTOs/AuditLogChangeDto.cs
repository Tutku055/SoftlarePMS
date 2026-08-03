namespace SoftPMS.Application.Features.SystemSettings.DTOs;

/// <summary>
/// Structured representation of a single property mutation within an audit log entry.
/// </summary>
public sealed class AuditLogChangeDto
{
    public string PropertyName { get; set; } = string.Empty;
    public string? OldValue { get; set; }
    public string? NewValue { get; set; }
}
