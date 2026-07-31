using MediatR;

namespace SoftPMS.Application.Features.Timesheets.Commands.GenerateMonthlyTimesheet;

public record GenerateMonthlyTimesheetCommand(Guid EmployeeId, int Year, int Month) : IRequest<Guid>;

