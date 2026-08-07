using SoftPMS.Domain.Enums;

namespace SoftPMS.Application.Features.Calendar.DTOs;

public class VirtualCalendarEventDto
{
    public string Id { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateOnly Date { get; set; }
    public VirtualEventType Type { get; set; }
    public string? ReferenceId { get; set; }
    public string ColorCode { get; set; } = "#10B981";
}
