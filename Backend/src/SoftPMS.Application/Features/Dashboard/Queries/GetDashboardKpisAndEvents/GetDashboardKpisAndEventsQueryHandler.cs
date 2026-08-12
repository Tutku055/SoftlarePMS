using MediatR;
using Microsoft.EntityFrameworkCore;
using SoftPMS.Application.Common.Interfaces;
using SoftPMS.Application.Features.Calendar.Queries.GetCalendarByDateRange;
using SoftPMS.Application.Features.Dashboard.DTOs;
using SoftPMS.Domain.Enums;

namespace SoftPMS.Application.Features.Dashboard.Queries.GetDashboardKpisAndEvents;

public class GetDashboardKpisAndEventsQueryHandler : IRequestHandler<GetDashboardKpisAndEventsQuery, DashboardKpisAndEventsDto>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly ISender _sender;

    public GetDashboardKpisAndEventsQueryHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService,
        ISender sender)
    {
        _context = context;
        _currentUserService = currentUserService;
        _sender = sender;
    }

    public async Task<DashboardKpisAndEventsDto> Handle(GetDashboardKpisAndEventsQuery request, CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;
        var firstDayOfMonth = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);

        var dto = new DashboardKpisAndEventsDto();

        // 1. KPIs
        dto.ActiveEmployeesCount = await _context.Employees
            .Where(e => !e.IsDeleted && e.EmploymentStatus == EmploymentStatus.Active)
            .CountAsync(cancellationToken);

        dto.TotalDepartmentsCount = await _context.Departments
            .CountAsync(cancellationToken);

        dto.NewHiresThisMonthCount = await _context.Employees
            .Where(e => !e.IsDeleted && e.HireDate >= firstDayOfMonth)
            .CountAsync(cancellationToken);

        // 2. Top 10 Notifications for the current user (Unread first, then newest)
        dto.TopNotifications = await _context.UserNotifications
            .AsNoTracking()
            .Where(n => !n.IsDeleted && n.UserId == _currentUserService.UserId)
            .OrderBy(n => n.IsRead)
            .ThenByDescending(n => n.CreatedAt)
            .Take(10)
            .Select(n => new DashboardNotificationDto
            {
                Id = n.Id,
                Type = n.Type,
                Title = n.Title,
                Message = n.Message,
                TargetDate = n.TargetDate,
                RemainingDays = n.RemainingDays,
                CreatedAt = n.CreatedAt,
                PayloadJson = n.PayloadJson,
                IsRead = n.IsRead
            })
            .ToListAsync(cancellationToken);

        // 3. Today's Events (reuses Calendar Logic via MediatR)
        // Adjust based on user's timezone if needed, but CalendarQuery handles offset internally
        // So we pass the current UTC date
        var today = DateOnly.FromDateTime(now);
        var calendarDays = await _sender.Send(new GetCalendarByDateRangeQuery(today, today), cancellationToken);
        
        dto.TodayEvents = calendarDays.FirstOrDefault();

        return dto;
    }
}
