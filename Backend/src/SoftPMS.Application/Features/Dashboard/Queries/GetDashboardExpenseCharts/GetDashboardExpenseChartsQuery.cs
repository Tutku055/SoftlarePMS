using MediatR;
using SoftPMS.Application.Features.Dashboard.DTOs;

namespace SoftPMS.Application.Features.Dashboard.Queries.GetDashboardExpenseCharts;

/// <summary>
/// Represents the Query to get dashboard expense charts.
/// </summary>
public class GetDashboardExpenseChartsQuery : IRequest<DashboardExpenseChartsDto>
{
}


