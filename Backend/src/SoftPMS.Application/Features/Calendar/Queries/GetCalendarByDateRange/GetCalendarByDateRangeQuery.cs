using MediatR;
using SoftPMS.Application.Features.Calendar.DTOs;

namespace SoftPMS.Application.Features.Calendar.Queries.GetCalendarByDateRange;

public record GetCalendarByDateRangeQuery(DateOnly StartDate, DateOnly EndDate) : IRequest<List<CalendarDayDto>>;
