using MediatR;
using SoftPMS.Application.Features.Dashboard.DTOs;

namespace SoftPMS.Application.Features.Dashboard.Queries.GetDashboardKpisAndEvents;

/// <summary>
/// Represents the Query to get dashboard kpis and events.
/// </summary>
public class GetDashboardKpisAndEventsQuery : IRequest<DashboardKpisAndEventsDto>
{
}


