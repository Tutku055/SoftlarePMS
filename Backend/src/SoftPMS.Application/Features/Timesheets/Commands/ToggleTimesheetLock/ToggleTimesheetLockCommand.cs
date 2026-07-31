using MediatR;

namespace SoftPMS.Application.Features.Timesheets.Commands.ToggleTimesheetLock;

public record ToggleTimesheetLockCommand(Guid EmployeeId, int Year, int Month, bool Lock) : IRequest<bool>;

