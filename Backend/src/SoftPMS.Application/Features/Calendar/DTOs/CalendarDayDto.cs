namespace SoftPMS.Application.Features.Calendar.DTOs;

public class CalendarDayDto
{
    public DateOnly Date { get; set; }
    public int DayNumber => Date.Day;
    public string DayOfWeek => Date.DayOfWeek.ToString();
    public bool IsToday { get; set; }
    public bool IsWeekend => Date.DayOfWeek is System.DayOfWeek.Saturday or System.DayOfWeek.Sunday;
    public List<CalendarNoteDto> Notes { get; set; } = [];
    public List<CalendarEventDto> PhysicalEvents { get; set; } = [];
    public List<VirtualCalendarEventDto> VirtualEvents { get; set; } = [];
}
