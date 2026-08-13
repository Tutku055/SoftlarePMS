using MediatR;

namespace SoftPMS.Application.Features.Timesheets.Commands.GenerateMonthlyTimesheet;

/// <summary>
/// Represents the Command to generate monthly timesheet.
/// </summary>
public record GenerateMonthlyTimesheetCommand(Guid EmployeeId, int Year, int Month) : IRequest<Guid>;



