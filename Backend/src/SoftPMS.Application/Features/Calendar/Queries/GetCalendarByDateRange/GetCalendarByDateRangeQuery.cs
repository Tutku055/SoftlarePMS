using MediatR;
using SoftPMS.Application.Features.Calendar.DTOs;

namespace SoftPMS.Application.Features.Calendar.Queries.GetCalendarByDateRange;

/// <summary>
/// Represents the Query to get calendar by date range.
/// </summary>
public record GetCalendarByDateRangeQuery(DateOnly StartDate, DateOnly EndDate) : IRequest<List<CalendarDayDto>>;


