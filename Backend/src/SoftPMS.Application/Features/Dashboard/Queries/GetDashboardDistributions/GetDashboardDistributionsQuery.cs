using MediatR;
using SoftPMS.Application.Features.Dashboard.DTOs;

namespace SoftPMS.Application.Features.Dashboard.Queries.GetDashboardDistributions;

public class GetDashboardDistributionsQuery : IRequest<DashboardDistributionsDto>
{
}
