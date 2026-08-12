using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SoftPMS.Application.Features.Dashboard.DTOs;
using SoftPMS.Application.Features.Dashboard.Queries.GetDashboardDistributions;
using SoftPMS.Application.Features.Dashboard.Queries.GetDashboardExpenseCharts;
using SoftPMS.Application.Features.Dashboard.Queries.GetDashboardKpisAndEvents;
using SoftPMS.WebApi.Authorization;

namespace SoftPMS.WebApi.Controllers;

[Authorize]
[Route("api/[controller]")]
[ApiController]
public class DashboardController : ControllerBase
{
    private readonly IMediator _mediator;

    public DashboardController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet("kpis-events")]
    [HasPermission("Employees.Read")]
    public async Task<ActionResult<DashboardKpisAndEventsDto>> GetKpisAndEvents()
    {
        return await _mediator.Send(new GetDashboardKpisAndEventsQuery());
    }

    [HttpGet("distributions")]
    [HasPermission("Departments.Read")]
    public async Task<ActionResult<DashboardDistributionsDto>> GetDistributions()
    {
        return await _mediator.Send(new GetDashboardDistributionsQuery());
    }

    [HttpGet("expense-charts")]
    [HasPermission("Compensations.Manage")]
    public async Task<ActionResult<DashboardExpenseChartsDto>> GetExpenseCharts()
    {
        return await _mediator.Send(new GetDashboardExpenseChartsQuery());
    }
}
