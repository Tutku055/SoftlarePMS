using Microsoft.EntityFrameworkCore;
using SoftPMS.Domain.Entities;

namespace SoftPMS.Application.Common.Interfaces;

/// <summary>
/// EF Core DbContext abstraction exposed to the Application layer.
/// Handlers use this interface instead of the concrete DbContext to keep
/// the Application layer independent of Persistence infrastructure.
/// </summary>
public interface IApplicationDbContext
{
    DbSet<Department> Departments { get; }
    DbSet<Employee> Employees { get; }
    DbSet<Profession> Professions { get; }
    DbSet<EmployeeAddress> EmployeeAddresses { get; }
    DbSet<EmployeeCompensation> EmployeeCompensations { get; }
    DbSet<MonthlyTimesheet> MonthlyTimesheets { get; }
    DbSet<TimesheetEntry> TimesheetEntries { get; }
    DbSet<OvertimeType> OvertimeTypes { get; }
    DbSet<PayrollSlip> PayrollSlips { get; }
    DbSet<PayrollSlipLineItem> PayrollSlipLineItems { get; }
    DbSet<Document> Documents { get; }
    DbSet<EmployeeNote> EmployeeNotes { get; }
    DbSet<EmployeeReference> EmployeeReferences { get; }
    DbSet<User> Users { get; }
    DbSet<Role> Roles { get; }
    DbSet<Permission> Permissions { get; }
    DbSet<RolePermission> RolePermissions { get; }
    DbSet<AuditLog> AuditLogs { get; }
    DbSet<YearlyRolloverLog> YearlyRolloverLogs { get; }
    DbSet<UserNotification> UserNotifications { get; }
    DbSet<NotificationTypeSetting> NotificationTypeSettings { get; }
    DbSet<NotificationOutbox> NotificationOutboxes { get; }
    DbSet<CalendarNote> CalendarNotes { get; }
    DbSet<CalendarEvent> CalendarEvents { get; }
    DbSet<EventReminderTracker> EventReminderTrackers { get; }
    DbSet<CalendarSetting> CalendarSettings { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
    Task<Microsoft.EntityFrameworkCore.Storage.IDbContextTransaction> BeginTransactionAsync(CancellationToken cancellationToken = default);
}
