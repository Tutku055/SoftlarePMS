using SoftPMS.Domain.Enums;
using SoftPMS.Application.Features.Calendar.DTOs;

namespace SoftPMS.Application.Features.Dashboard.DTOs;

public class DashboardKpisAndEventsDto
{
    public int ActiveEmployeesCount { get; set; }
    public int TotalDepartmentsCount { get; set; }
    public int NewHiresThisMonthCount { get; set; }

    public List<DashboardNotificationDto> TopNotifications { get; set; } = new();
    
    // We reuse CalendarDayDto to seamlessly integrate with the Calendar module's Agenda view
    public CalendarDayDto? TodayEvents { get; set; }
}

public class DashboardNotificationDto
{
    public Guid Id { get; set; }
    public NotificationType Type { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public DateTime? TargetDate { get; set; }
    public int? RemainingDays { get; set; }
    public DateTime CreatedAt { get; set; }
    public string? PayloadJson { get; set; }
    public bool IsRead { get; set; }
}
