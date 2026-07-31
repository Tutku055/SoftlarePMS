using FluentValidation;
using SoftPMS.Domain.Enums;

namespace SoftPMS.Application.Features.Timesheets.Commands.BulkTimesheetOperation;

public class BulkTimesheetOperationCommandValidator : AbstractValidator<BulkTimesheetOperationCommand>
{
    public BulkTimesheetOperationCommandValidator()
    {
        RuleFor(x => x.Year)
            .GreaterThan(2000).WithMessage("Year must be valid.");

        RuleFor(x => x.Month)
            .InclusiveBetween(1, 12).WithMessage("Month must be between 1 and 12.");

        // Rule 5: Period ↔ Action mutual exclusion
        RuleFor(x => x.Action)
            .Must(a => a == BulkTimesheetAction.GenerateTimesheet || a == BulkTimesheetAction.Lock || a == BulkTimesheetAction.Unlock)
            .When(x => x.PeriodType == BulkTimesheetPeriodType.Month)
            .WithMessage("When period is 'Month', only Generate Timesheet and Manage Lock actions are allowed.");

        RuleFor(x => x.Action)
            .Must(a => a == BulkTimesheetAction.ApplyStatus || a == BulkTimesheetAction.ApplyOvertime || a == BulkTimesheetAction.ApplyLeaveHours)
            .When(x => x.PeriodType == BulkTimesheetPeriodType.Day || x.PeriodType == BulkTimesheetPeriodType.DayInterval)
            .WithMessage("When period is 'Day' or 'Day Interval', only Apply Status, Apply Overtime, and Apply Leave Hours actions are allowed.");

        // ApplyStatus requires a Status value
        RuleFor(x => x.Status)
            .NotNull()
            .When(x => x.Action == BulkTimesheetAction.ApplyStatus)
            .WithMessage("A status must be specified for the Apply Status action.");

        // ApplyOvertime requires OvertimeHours and OvertimeTypeId
        RuleFor(x => x.OvertimeHours)
            .GreaterThan(0)
            .When(x => x.Action == BulkTimesheetAction.ApplyOvertime)
            .WithMessage("Overtime hours must be greater than 0.");

        RuleFor(x => x.OvertimeTypeId)
            .NotNull()
            .When(x => x.Action == BulkTimesheetAction.ApplyOvertime)
            .WithMessage("Overtime type must be selected.");

        // ApplyLeaveHours requires at least one of PaidLeaveHours or UnpaidLeaveHours
        RuleFor(x => x)
            .Must(x => (x.PaidLeaveHours ?? 0) > 0 || (x.UnpaidLeaveHours ?? 0) > 0)
            .When(x => x.Action == BulkTimesheetAction.ApplyLeaveHours)
            .WithMessage("At least one of Paid Leave or Unpaid Leave hours must be greater than 0.");

        // Day period requires Day value
        RuleFor(x => x.Day)
            .NotNull()
            .When(x => x.PeriodType == BulkTimesheetPeriodType.Day)
            .WithMessage("Day is required when period type is 'Day'.");

        RuleFor(x => x.Day)
            .InclusiveBetween(1, 31)
            .When(x => x.PeriodType == BulkTimesheetPeriodType.Day && x.Day.HasValue)
            .WithMessage("Day must be between 1 and 31.");

        // Rule 4: DayInterval requires StartDate and EndDate within the same month
        RuleFor(x => x.StartDate)
            .NotNull()
            .When(x => x.PeriodType == BulkTimesheetPeriodType.DayInterval)
            .WithMessage("Start date is required for day interval.");

        RuleFor(x => x.EndDate)
            .NotNull()
            .When(x => x.PeriodType == BulkTimesheetPeriodType.DayInterval)
            .WithMessage("End date is required for day interval.");



        RuleFor(x => x)
            .Must(x => x.StartDate!.Value <= x.EndDate!.Value)
            .When(x => x.PeriodType == BulkTimesheetPeriodType.DayInterval && x.StartDate.HasValue && x.EndDate.HasValue)
            .WithMessage("Start date must be before or equal to end date.");

        // Scope-specific validations
        RuleFor(x => x.DepartmentId)
            .NotNull()
            .When(x => x.Scope == BulkTimesheetScope.Department)
            .WithMessage("Department must be selected when scope is 'Department'.");

        RuleFor(x => x.EmployeeIds)
            .NotNull()
            .When(x => x.Scope == BulkTimesheetScope.Selected)
            .WithMessage("Employee IDs are required when scope is 'Selected'.");

        RuleFor(x => x.EmployeeIds)
            .Must(ids => ids != null && ids.Count > 0)
            .When(x => x.Scope == BulkTimesheetScope.Selected)
            .WithMessage("At least one employee must be selected.");
    }
}
