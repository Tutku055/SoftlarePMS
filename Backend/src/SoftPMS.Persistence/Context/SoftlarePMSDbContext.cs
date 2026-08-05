using Microsoft.EntityFrameworkCore;
using SoftPMS.Application.Common.Interfaces;
using SoftPMS.Domain.Entities;

namespace SoftPMS.Persistence.Context;

/// <summary>
/// The EF Core DbContext for SoftPMS.
/// Implements IApplicationDbContext so MediatR handlers can depend on the interface
/// without importing the Persistence assembly.
/// Audit logging is handled exclusively by AuditSaveChangesInterceptor (registered in DI);
/// no SaveChangesAsync override is used here — the DbContext stays clean.
/// </summary>
public class SoftPMSDbContext : DbContext, IApplicationDbContext
{
    public SoftPMSDbContext(DbContextOptions<SoftPMSDbContext> options) : base(options)
    {
    }

    #region Security & User Management DbSets
    public DbSet<User> Users { get; set; }
    public DbSet<Role> Roles { get; set; }
    public DbSet<Permission> Permissions { get; set; }
    public DbSet<RolePermission> RolePermissions { get; set; }
    #endregion

    #region Core Personnel DbSets
    public DbSet<Department> Departments { get; set; }
    public DbSet<Employee> Employees { get; set; }
    public DbSet<Profession> Professions { get; set; }
    public DbSet<EmployeeAddress> EmployeeAddresses { get; set; }
    public DbSet<EmployeeCompensation> EmployeeCompensations { get; set; }
    public DbSet<MonthlyTimesheet> MonthlyTimesheets { get; set; }
    public DbSet<TimesheetEntry> TimesheetEntries { get; set; }
    public DbSet<OvertimeType> OvertimeTypes { get; set; }
    public DbSet<PayrollSlip> PayrollSlips { get; set; }
    public DbSet<PayrollSlipLineItem> PayrollSlipLineItems { get; set; }
    public DbSet<Document> Documents { get; set; }
    public DbSet<EmployeeNote> EmployeeNotes { get; set; }
    public DbSet<EmployeeReference> EmployeeReferences { get; set; }
    #endregion

    #region Audit & Settings
    public DbSet<AuditLog> AuditLogs { get; set; }
    public DbSet<YearlyRolloverLog> YearlyRolloverLogs { get; set; }
    #endregion

    #region Notifications
    public DbSet<UserNotification> UserNotifications { get; set; }
    public DbSet<NotificationTypeSetting> NotificationTypeSettings { get; set; }
    #endregion

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Automatically applies all IEntityTypeConfiguration<T> classes in this assembly
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(SoftPMSDbContext).Assembly);
    }

    public Task<Microsoft.EntityFrameworkCore.Storage.IDbContextTransaction> BeginTransactionAsync(CancellationToken cancellationToken = default)
    {
        return Database.BeginTransactionAsync(cancellationToken);
    }
}
