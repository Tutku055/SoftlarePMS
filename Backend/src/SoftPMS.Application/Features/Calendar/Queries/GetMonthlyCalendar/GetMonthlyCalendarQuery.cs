using MediatR;
using SoftPMS.Application.Features.Calendar.DTOs;

namespace SoftPMS.Application.Features.Calendar.Queries.GetMonthlyCalendar;

public record GetMonthlyCalendarQuery(int Year, int Month) : IRequest<List<CalendarDayDto>>;
