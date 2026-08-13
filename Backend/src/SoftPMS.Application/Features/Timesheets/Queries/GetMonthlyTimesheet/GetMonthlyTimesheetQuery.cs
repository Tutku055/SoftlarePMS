using MediatR;
using SoftPMS.Application.Features.Timesheets.DTOs;

namespace SoftPMS.Application.Features.Timesheets.Queries.GetMonthlyTimesheet;

/// <summary>
/// Represents the Query to get monthly timesheet.
/// </summary>
public record GetMonthlyTimesheetQuery(Guid EmployeeId, int Year, int Month) : IRequest<MonthlyTimesheetDto?>;



