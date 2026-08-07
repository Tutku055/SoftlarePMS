using MediatR;
using SoftPMS.Application.Features.Calendar.DTOs;
using SoftPMS.Application.Features.Calendar.Queries.GetCalendarByDateRange;

namespace SoftPMS.Application.Features.Calendar.Queries.GetMonthlyCalendar;

public class GetMonthlyCalendarQueryHandler : IRequestHandler<GetMonthlyCalendarQuery, List<CalendarDayDto>>
{
    private readonly ISender _sender;

    public GetMonthlyCalendarQueryHandler(ISender sender)
    {
        _sender = sender;
    }

    public async Task<List<CalendarDayDto>> Handle(GetMonthlyCalendarQuery request, CancellationToken cancellationToken)
    {
        var daysInMonth = DateTime.DaysInMonth(request.Year, request.Month);
        var startDate = new DateOnly(request.Year, request.Month, 1);
        var endDate = new DateOnly(request.Year, request.Month, daysInMonth);

        return await _sender.Send(new GetCalendarByDateRangeQuery(startDate, endDate), cancellationToken);
    }
}
