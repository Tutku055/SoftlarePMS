using MediatR;

namespace SoftPMS.Application.Features.Timesheets.Commands.ToggleTimesheetLock;

/// <summary>
/// Represents the Command to toggle timesheet lock.
/// </summary>
public record ToggleTimesheetLockCommand(Guid EmployeeId, int Year, int Month, bool Lock) : IRequest<bool>;



