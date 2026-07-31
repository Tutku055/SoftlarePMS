using MediatR;
using SoftPMS.Domain.Enums;

namespace SoftPMS.Application.Features.Timesheets.Commands.UpdateTimesheetEntry;

public record UpdateTimesheetEntryCommand(
    Guid EntryId, 
    TimesheetStatus Status, 
    decimal OvertimeHours, 
    Guid? OvertimeTypeId,
    decimal WorkedHours,
    decimal PaidLeaveHours,
    decimal UnpaidLeaveHours
) : IRequest<bool>;

