namespace SoftPMS.Domain.Enums;

/// <summary>
/// Predefined notification types for the PMS domain.
/// Future modules (e.g. Events/Calendars) can add new types here seamlessly.
/// </summary>
public enum NotificationType
{
    /// <summary>Expiring employee documents or certificates.</summary>
    DocumentExpiry = 1,

    /// <summary>Financial and timesheet alerts (e.g., missing timesheets for the period).</summary>
    FinanceAlert = 2,

    /// <summary>System-wide passive alerts and maintenance updates.</summary>
    SystemAnnouncement = 3,

    /// <summary>Upcoming calendar events or scheduled organizational milestones.</summary>
    EventUpcoming = 4
}
