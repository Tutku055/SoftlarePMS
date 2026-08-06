namespace SoftPMS.Application.Features.Notifications.Configurations;

/// <summary>
/// Centralized threshold configurations and rule metadata for Audit Anomaly Detection & System Announcements.
/// Zero-dependency, pure rule specifications with descriptive domain terminology.
/// </summary>
public static class AuditAnomalyRules
{
    /// <summary>
    /// Security & Recurrence Anomaly Rules:
    /// Tracks sudden user spikes, rapid permission volatility, and excessive payroll recalculations.
    /// </summary>
    public static class SecurityRecurrence
    {
        // User Account Spike (Evaluates in 15 mins window, low: >=2, moderate: >=4, high: >=8, critical: >=15)
        public const string UserCrudSpikeRuleCode = "UserCrudSpike";
        public const int UserCrudWindowMinutes = 15;
        public const int UserCrudThresholdMin = 2;

        // Permission Churn (Evaluates in 15 mins window, low: >=3, moderate: >=6, high: >=12, critical: >=25)
        public const string PermissionChurnRuleCode = "PermissionChurn";
        public const int PermissionChangesWindowMinutes = 15;
        public const int PermissionChangesThresholdMin = 3;

        // Payroll Recalculation Spike (Evaluates in 15 mins window, low: >=3, moderate: >=5, high: >=8, critical: >=15)
        public const string PayrollRecalculationRuleCode = "PayrollRecalculationSpike";
        public const int PayrollRecalculationThresholdMin = 3;
    }

    /// <summary>
    /// High-Volume Mutation Anomaly Rules:
    /// Monitors distinct primary entity IDs to eliminate false positives from child table updates.
    /// </summary>
    public static class HighVolumeMutation
    {
        // Employee Primary Record Mutations (15 mins window: Deletions >=2, Updates >=5)
        public const string EmployeeCrudSpikeRuleCode = "EmployeeCrudSpike";
        public const int EmployeeCrudWindowMinutes = 15;
        public const int EmployeeDeletionsThresholdMin = 2;
        public const int EmployeeUpdatesThresholdMin = 5;

        // Role CRUD & Permission Strip (15 mins window: Role deleted >=1 OR Perms deleted >=5)
        public const string RoleCrudAnomalyRuleCode = "RoleCrudAnomaly";
        public const int RoleCrudWindowMinutes = 15;
        public const int RoleDeletionsThresholdMin = 1;
        public const int RolePermissionBulkDeletionThresholdMin = 5;

        // Employee-Specific Document Deletions (15 mins window: low: >=3, mod: >=5, high: >=10, critical: >=20)
        public const string EmployeeDocumentBulkDeletionRuleCode = "EmployeeDocumentBulkDeletion";
        public const int EmployeeDocumentWindowMinutes = 15;
        public const int EmployeeDocumentMinFloor = 3;
        public const double EmployeeDocumentPercentThreshold = 0.05;

        // Department Membership Churn (15 mins window: low: >=3, mod: >=5, high: >=10, critical: >=20)
        public const string DepartmentMembershipChurnRuleCode = "DepartmentMembershipChurn";
        public const int DepartmentMembershipWindowMinutes = 15;
        public const int DepartmentMembershipThresholdMin = 3;
    }

    /// <summary>
    /// Period & Business Calendar Milestone Rules:
    /// Evaluates time-sensitive business milestones based on calendar dates and record completeness.
    /// </summary>
    public static class PeriodAndCalendar
    {
        // Timesheet Submission Proximity Summary (Rule: Within last 3 days of month AND > 30% active staff missing)
        public const string TimesheetCutoffSummaryRuleCode = "TimesheetCutoffSummary";
        public const int TimesheetCutoffProximityDays = 3;
        public const double TimesheetMissingThresholdPercent = 0.30;

        // Year-End Closure & Rollover Audit (Rule: 1st week of January & previous year not closed -> Critical)
        public const string YearEndProcessPendingRuleCode = "YearEndProcessPending";
        public const int YearEndAuditMaxDayOfJanuary = 7;
    }
}
