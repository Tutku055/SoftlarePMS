using MediatR;
using SoftPMS.Application.Features.Dashboard.DTOs;

namespace SoftPMS.Application.Features.Dashboard.Queries.GetDashboardDistributions;

/// <summary>
/// Represents the Query to get dashboard distributions.
/// </summary>
public class GetDashboardDistributionsQuery : IRequest<DashboardDistributionsDto>
{
}


