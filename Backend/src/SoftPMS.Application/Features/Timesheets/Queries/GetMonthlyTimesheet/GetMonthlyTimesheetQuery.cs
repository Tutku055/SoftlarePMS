using MediatR;
using SoftPMS.Application.Features.Timesheets.DTOs;

namespace SoftPMS.Application.Features.Timesheets.Queries.GetMonthlyTimesheet;

public record GetMonthlyTimesheetQuery(Guid EmployeeId, int Year, int Month) : IRequest<MonthlyTimesheetDto?>;

