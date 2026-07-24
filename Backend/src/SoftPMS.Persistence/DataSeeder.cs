using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using SoftPMS.Domain.Entities;
using SoftPMS.Persistence.Context;

namespace SoftPMS.Persistence;

/// <summary>
/// Runs at application startup to ensure the database schema is up to date
/// and the seed data (permissions, admin role, admin user) is present.
/// Safe to re-run — all inserts are conditional on existing data.
/// </summary>
public static class DatabaseSeeder
{
    // All system-defined permissions in "Resource.Action" format
    private static readonly (string Name, string Description)[] SeedPermissions =
    [
        ("Dashboard.Read",   "View dashboard metrics and summaries"),
        ("Employees.Read",   "View employee records"),
        ("Employees.Create", "Create new employee records"),
        ("Employees.Update", "Edit existing employee records"),
        ("Employees.Delete", "Delete employee records"),
        ("EmployeeNotes.Read", "View employee notes"),
        ("EmployeeNotes.Create", "Create employee notes"),
        ("EmployeeNotes.Update", "Edit employee notes"),
        ("EmployeeNotes.Delete", "Delete employee notes"),
        ("EmployeeNotes.ReadConfidential", "Read confidential employee notes"),
        ("EmployeeNotes.ManageConfidentiality", "Set or change confidentiality on employee notes"),
        ("EmployeeReferences.Read", "View employee references"),
        ("EmployeeReferences.Create", "Create employee references"),
        ("EmployeeReferences.Update", "Edit employee references"),
        ("EmployeeReferences.Delete", "Delete employee references"),
        ("Departments.Read", "View departments"),
        ("Departments.Create", "Create new departments"),
        ("Departments.Update", "Edit departments"),
        ("Departments.Delete", "Delete departments"),
        ("Documents.Read",   "View documents"),
        ("Documents.Create", "Upload documents"),
        ("Documents.Update", "Edit documents"),
        ("Documents.Delete", "Delete documents"),
        ("Roles.Read",       "View roles"),
        ("Roles.Create",     "Create new roles"),
        ("Roles.Update",     "Edit roles"),
        ("Roles.Delete",     "Delete roles"),
        ("Permissions.Assign", "Assign permissions to roles"),
        ("Users.Read",       "View user accounts"),
        ("Users.Create",     "Create user accounts"),
        ("Users.Update",     "Edit user accounts"),
        ("Users.Delete",     "Delete user accounts"),
        ("Users.ChangePassword", "Change user password"),
        ("Permissions.Read", "View available permissions"),
    ];

    private const string AdminRoleName = "Admin";
    private const string AdminUsername  = "admin";
    private const string AdminEmail     = "admin@SoftPMS.com";
    private const string AdminPassword  = "Admin@123!"; // Override via env / user-secrets in production

    public static async Task SeedAsync(IServiceProvider rootProvider, CancellationToken ct = default)
    {
        await using var scope = rootProvider.CreateAsyncScope();
        var sp     = scope.ServiceProvider;
        var db     = sp.GetRequiredService<SoftPMSDbContext>();
        var logger = sp.GetRequiredService<ILogger<SoftPMSDbContext>>();

        try
        {
            // ── 1. Apply pending EF Core migrations ──────────────────────────
            await db.Database.MigrateAsync(ct);
            logger.LogInformation("Database migrations applied successfully.");

            // ── 2. Seed permissions ──────────────────────────────────────────
            var existingNames = await db.Permissions
                .Select(p => p.Name)
                .ToHashSetAsync(ct);

            var missing = SeedPermissions
                .Where(x => !existingNames.Contains(x.Name))
                .Select(x => new Permission { Name = x.Name, Description = x.Description })
                .ToList();

            if (missing.Count > 0)
            {
                db.Permissions.AddRange(missing);
                await db.SaveChangesAsync(ct);
                logger.LogInformation("Seeded {Count} new permission(s).", missing.Count);
            }

            // ── 3. Seed Admin role ────────────────────────────────────────────
            var adminRole = await db.Roles
                .Include(r => r.RolePermissions)
                .FirstOrDefaultAsync(r => r.Name == AdminRoleName, ct);

            if (adminRole is null)
            {
                adminRole = new Role
                {
                    Name        = AdminRoleName,
                    Description = "System administrator with full access",
                };
                db.Roles.Add(adminRole);
                await db.SaveChangesAsync(ct);
                logger.LogInformation("Seeded 'Admin' role.");
            }

            // ── 4. Assign ALL permissions to the Admin role (idempotent) ─────
            var allPermissions     = await db.Permissions.ToListAsync(ct);
            var assignedIds        = adminRole.RolePermissions.Select(rp => rp.PermissionId).ToHashSet();
            var missingPermLinks = allPermissions
                .Where(p => p.Name != "Permissions.Assign") // Do not auto-assign this
                .Where(p => !assignedIds.Contains(p.Id))
                .Select(p => new RolePermission { RoleId = adminRole.Id, PermissionId = p.Id })
                .ToList();

            if (missingPermLinks.Count > 0)
            {
                db.RolePermissions.AddRange(missingPermLinks);
                await db.SaveChangesAsync(ct);
                logger.LogInformation("Assigned {Count} permission(s) to Admin role.", missingPermLinks.Count);
            }

            // ── 5. Seed Admin user ────────────────────────────────────────────
            var adminUser = await db.Users
                .Include(u => u.Role)
                .FirstOrDefaultAsync(u => u.Username == AdminUsername, ct);

            if (adminUser is null)
            {
                adminUser = new User
                {
                    Username     = AdminUsername,
                    Email        = AdminEmail,
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword(AdminPassword),
                    IsActive     = true,
                    RoleId       = adminRole.Id,
                };
                db.Users.Add(adminUser);
                await db.SaveChangesAsync(ct);
                logger.LogInformation("Seeded admin user '{Username}' with 'Admin' role.", AdminUsername);
            }
            else if (adminUser.RoleId != adminRole.Id)
            {
                adminUser.RoleId = adminRole.Id;
                await db.SaveChangesAsync(ct);
                logger.LogInformation("Assigned 'Admin' role to admin user.");
            }

            // ── 6. Seed SuperAdmin role ────────────────────────────────────────────
            var superAdminRoleName = "SuperAdmin";
            var superAdminRole = await db.Roles
                .Include(r => r.RolePermissions)
                .FirstOrDefaultAsync(r => r.Name == superAdminRoleName || r.Name == "Super Admin", ct);

            if (superAdminRole is null)
            {
                superAdminRole = new Role
                {
                    Name        = superAdminRoleName,
                    Description = "Super Administrator",
                    Color       = ""
                };
                db.Roles.Add(superAdminRole);
                await db.SaveChangesAsync(ct);
                logger.LogInformation("Seeded 'SuperAdmin' role.");
            }
            else
            {
                var roleChanged = false;
                if (superAdminRole.Name != superAdminRoleName)
                {
                    superAdminRole.Name = superAdminRoleName;
                    roleChanged = true;
                }
                if (superAdminRole.Color != "")
                {
                    superAdminRole.Color = "";
                    roleChanged = true;
                }
                if (roleChanged)
                {
                    await db.SaveChangesAsync(ct);
                }
            }

            // ── 7. Assign ALL permissions to the Super Admin role ─────
            var saAssignedIds = superAdminRole.RolePermissions.Select(rp => rp.PermissionId).ToHashSet();
            
            var saMissingPermLinks = allPermissions
                .Where(p => !saAssignedIds.Contains(p.Id))
                .Select(p => new RolePermission { RoleId = superAdminRole.Id, PermissionId = p.Id })
                .ToList();

            if (saMissingPermLinks.Count > 0)
            {
                db.RolePermissions.AddRange(saMissingPermLinks);
                await db.SaveChangesAsync(ct);
                logger.LogInformation("Assigned {Count} missing permission(s) to Super Admin role.", saMissingPermLinks.Count);
            }

            // ── 8. Seed Super Admin user ────────────────────────────────────────────
            var superAdminUser = await db.Users
                .FirstOrDefaultAsync(u => u.Username == "SuperAdmin", ct);

            if (superAdminUser is null)
            {
                superAdminUser = new User
                {
                    Username     = "SuperAdmin",
                    Email        = "superadmin@SoftPMS.com",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("SoftPMS"),
                    IsActive     = true,
                    RoleId       = superAdminRole.Id,
                    RequiresPasswordChange = true,
                    IsSystemUser = true
                };
                db.Users.Add(superAdminUser);
                await db.SaveChangesAsync(ct);
                logger.LogInformation("Seeded SuperAdmin user.");
            }
            else
            {
                // Ensure system flags are correct, but do NOT override user password or RequiresPasswordChange flag!
                var changed = false;
                if (!superAdminUser.IsSystemUser)
                {
                    superAdminUser.IsSystemUser = true;
                    changed = true;
                }
                
                if (superAdminUser.RoleId != superAdminRole.Id)
                {
                    superAdminUser.RoleId = superAdminRole.Id;
                    changed = true;
                }

                if (changed)
                {
                    await db.SaveChangesAsync(ct);
                    logger.LogInformation("Updated existing SuperAdmin user with required system flags.");
                }
            }

            logger.LogInformation("Database seeding completed successfully.");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "An error occurred while seeding the database.");
            throw; // Fail fast — a mis-configured DB should prevent startup
        }
    }
}
