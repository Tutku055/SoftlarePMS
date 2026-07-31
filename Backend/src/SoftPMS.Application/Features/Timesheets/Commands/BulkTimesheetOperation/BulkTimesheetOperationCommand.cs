using MediatR;
using SoftPMS.Application.Features.Timesheets.DTOs;
using SoftPMS.Domain.Enums;

namespace SoftPMS.Application.Features.Timesheets.Commands.BulkTimesheetOperation;

public record BulkTimesheetOperationCommand(
    BulkTimesheetAction Action,
    BulkTimesheetScope Scope,
    BulkTimesheetPeriodType PeriodType,
    int Year,
    int Month,
    int? Day,
    DateTime? StartDate,
    DateTime? EndDate,
    Guid? DepartmentId,
    List<Guid>? EmployeeIds,
    TimesheetStatus? Status,
    decimal? OvertimeHours,
    Guid? OvertimeTypeId,
    decimal? PaidLeaveHours,
    decimal? UnpaidLeaveHours
) : IRequest<BulkOperationResultDto>;

