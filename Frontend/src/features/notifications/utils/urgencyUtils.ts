import { NotificationType } from '../types';
import type { NotificationUrgency } from '../types';

export interface UrgencyThemeStyle {
  text: string;
  bg: string;
  border: string;
  badgeBg: string;
  accentBar: string;
  glow: string;
}

/**
 * Safely parses date strings ensuring UTC timestamps from backend without explicit 'Z'
 * are correctly parsed in UTC rather than the client's local timezone.
 */
export function parseUtcDate(dateString: string | null | undefined): Date {
  if (!dateString) return new Date(NaN);
  const trimmed = dateString.trim();
  if (trimmed.includes('T') && !trimmed.endsWith('Z') && !/[+-]\d{2}:?\d{2}$/.test(trimmed)) {
    return new Date(trimmed + 'Z');
  }
  return new Date(trimmed);
}

/**
 * Calculates dynamic urgency status:
 * - For SystemAnnouncements / Payload-driven alerts: Directly maps the anomaly severity (Low, Moderate, High, Critical).
 * - For Date-driven alerts (Document expiry, Finance, Events): Computes dynamic ratio from thresholdDays & remainingDays.
 */
export function calculateNotificationUrgency(
  remainingDays?: number | null,
  targetDate?: string | null,
  thresholdDays: number = 30,
  type?: NotificationType,
  payloadJson?: string | null
): NotificationUrgency {
  // System Announcements and anomaly alerts prioritize rule-evaluated severity in payloadJson
  if (type === NotificationType.SystemAnnouncement || payloadJson) {
    if (payloadJson) {
      try {
        const payload = JSON.parse(payloadJson);
        if (payload?.severity) {
          const sev = String(payload.severity).trim().toLowerCase();
          if (sev === 'critical') return 'Critical';
          if (sev === 'high') return 'High';
          if (sev === 'moderate' || sev === 'warning') return 'Moderate';
          if (sev === 'low' || sev === 'info') return 'Low';
        }
      } catch {
        // Fallback if payload JSON is malformed
      }
    }

    if (type === NotificationType.SystemAnnouncement) {
      return 'Low';
    }
  }

  let days = remainingDays;

  // If remainingDays is not provided but targetDate is present, compute days from current timestamp
  if ((days === null || days === undefined) && targetDate) {
    const target = parseUtcDate(targetDate);
    if (!isNaN(target.getTime())) {
      const now = new Date();
      // Set to start of day for clean calculation
      const nowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const targetStart = new Date(target.getFullYear(), target.getMonth(), target.getDate());
      const diffMs = targetStart.getTime() - nowStart.getTime();
      days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    }
  }

  // If no date reference is found, this is an informational announcement
  if (days === null || days === undefined) {
    return 'Low';
  }

  // If due today or already overdue/past deadline, it is Critical
  if (days <= 0) {
    return 'Critical';
  }

  // Dynamic ratio evaluation based on adjusted threshold
  const safeThreshold = Math.max(thresholdDays, 1);
  const criticalCutoff = Math.max(1, Math.floor(safeThreshold * 0.15));
  const highCutoff = Math.max(criticalCutoff + 1, Math.floor(safeThreshold * 0.40));
  const moderateCutoff = Math.max(highCutoff + 1, Math.floor(safeThreshold * 0.75));

  if (days <= criticalCutoff) {
    return 'Critical';
  }
  if (days <= highCutoff) {
    return 'High';
  }
  if (days <= moderateCutoff) {
    return 'Moderate';
  }
  return 'Low';
}

/**
 * Get theme-compatible colors and styles for an urgency level.
 */
export function getUrgencyThemeStyles(urgency: NotificationUrgency, isDarkMode: boolean): UrgencyThemeStyle {
  switch (urgency) {
    case 'Critical':
      return isDarkMode
        ? {
            text: '#F87171',
            bg: 'rgba(239, 68, 68, 0.16)',
            border: 'rgba(248, 113, 113, 0.35)',
            badgeBg: '#DC2626',
            accentBar: '#EF4444',
            glow: '0 0 12px rgba(239, 68, 68, 0.35)',
          }
        : {
            text: '#DC2626',
            bg: 'rgba(254, 242, 242, 0.95)',
            border: 'rgba(239, 68, 68, 0.3)',
            badgeBg: '#EF4444',
            accentBar: '#DC2626',
            glow: '0 2px 8px rgba(239, 68, 68, 0.15)',
          };

    case 'High':
      return isDarkMode
        ? {
            text: '#FBBF24',
            bg: 'rgba(245, 158, 11, 0.16)',
            border: 'rgba(251, 191, 36, 0.35)',
            badgeBg: '#D97706',
            accentBar: '#F59E0B',
            glow: '0 0 12px rgba(245, 158, 11, 0.35)',
          }
        : {
            text: '#B45309',
            bg: 'rgba(255, 251, 235, 0.95)',
            border: 'rgba(245, 158, 11, 0.3)',
            badgeBg: '#F59E0B',
            accentBar: '#D97706',
            glow: '0 2px 8px rgba(245, 158, 11, 0.15)',
          };

    case 'Moderate':
      return isDarkMode
        ? {
            text: '#60A5FA',
            bg: 'rgba(59, 130, 246, 0.16)',
            border: 'rgba(96, 165, 250, 0.35)',
            badgeBg: '#2563EB',
            accentBar: '#3B82F6',
            glow: '0 0 12px rgba(59, 130, 246, 0.35)',
          }
        : {
            text: '#1D4ED8',
            bg: 'rgba(239, 246, 255, 0.95)',
            border: 'rgba(59, 130, 246, 0.3)',
            badgeBg: '#3B82F6',
            accentBar: '#2563EB',
            glow: '0 2px 8px rgba(59, 130, 246, 0.15)',
          };

    case 'Low':
    default:
      return isDarkMode
        ? {
            text: '#34D399',
            bg: 'rgba(16, 185, 129, 0.16)',
            border: 'rgba(52, 211, 153, 0.35)',
            badgeBg: '#059669',
            accentBar: '#10B981',
            glow: '0 0 12px rgba(16, 185, 129, 0.35)',
          }
        : {
            text: '#047857',
            bg: 'rgba(236, 253, 245, 0.95)',
            border: 'rgba(16, 185, 129, 0.3)',
            badgeBg: '#10B981',
            accentBar: '#059669',
            glow: '0 2px 8px rgba(16, 185, 129, 0.15)',
          };
  }
}

/**
 * Metadata configuration for notification types.
 */
export interface NotificationTypeMeta {
  type: NotificationType;
  label: string;
  shortLabel: string;
  description: string;
  color: string;
  iconName: 'document' | 'finance' | 'system' | 'event';
  requiredPermissions: string[];
}

export const NOTIFICATION_TYPE_CONFIG: Record<NotificationType, NotificationTypeMeta> = {
  [NotificationType.DocumentExpiry]: {
    type: NotificationType.DocumentExpiry,
    label: 'Document Expiry',
    shortLabel: 'Document',
    description: 'Expiring employee documents and certificates',
    color: '#8B5CF6',
    iconName: 'document',
    requiredPermissions: ['Documents.Read'],
  },
  [NotificationType.FinanceAlert]: {
    type: NotificationType.FinanceAlert,
    label: 'Finance & Timesheet Alert',
    shortLabel: 'Finance',
    description: 'Monthly timesheets and financial review alerts',
    color: '#F59E0B',
    iconName: 'finance',
    requiredPermissions: ['Timesheets.Read', 'Payrolls.Read'],
  },
  [NotificationType.SystemAnnouncement]: {
    type: NotificationType.SystemAnnouncement,
    label: 'System Announcement',
    shortLabel: 'System',
    description: 'System-wide maintenance and operational passive notices',
    color: '#6366F1',
    iconName: 'system',
    requiredPermissions: ['AuditLogs.Read', 'SystemSettings.YearEndOperations'],
  },
  [NotificationType.EventUpcoming]: {
    type: NotificationType.EventUpcoming,
    label: 'Upcoming Event',
    shortLabel: 'Event',
    description: 'Scheduled organizational milestones and calendar events',
    color: '#10B981',
    iconName: 'event',
    requiredPermissions: [],
  },
};

/**
 * Format relative time (e.g. "Just now", "5m ago", "2h ago", "Yesterday", "3d ago")
 */
export function formatRelativeTime(dateString: string): string {
  const date = parseUtcDate(dateString);
  if (isNaN(date.getTime())) return '';

  const now = new Date();
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

  // If created within the last minute or slight client/server clock variance
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;
  const diffDays = Math.floor(diffHour / 24);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}
