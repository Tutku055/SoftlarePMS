import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  Chip,
  IconButton,
  Button,
  Tooltip,
  useTheme,
} from '@mui/material';
import {
  DescriptionRounded,
  MonetizationOnRounded,
  CampaignRounded,
  EventRounded,
  CheckCircleOutlineRounded,
  MarkEmailUnreadRounded,
  DeleteOutlineRounded,
  AccessTimeRounded,
  WarningAmberRounded,
  FiberManualRecordRounded,
  PersonOutlineRounded,
  PersonRounded,
  LaunchRounded,
  AccountBalanceWalletRounded,
  BusinessRounded,
  EventRepeatRounded,
  DateRangeRounded,
  AdminPanelSettingsRounded,
  GroupRounded,
  PeopleAltRounded,
  HistoryRounded,
  FolderCopyRounded,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import type { UserNotificationDto } from '../types';
import { NotificationType } from '../types';
import {
  getUrgencyThemeStyles,
  NOTIFICATION_TYPE_CONFIG,
  formatRelativeTime,
  parseUtcDate,
} from '../utils/urgencyUtils';
import { FinanceAlertMissingRecordsModal } from './FinanceAlertMissingRecordsModal';

interface NotificationCardProps {
  notification: UserNotificationDto;
  onToggleRead?: (id: string) => Promise<void>;
  onMarkAsRead?: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  disabled?: boolean;
}

export const NotificationCard: React.FC<NotificationCardProps> = ({
  notification,
  onToggleRead,
  onMarkAsRead,
  onDelete,
  disabled = false,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const navigate = useNavigate();
  const [isBusy, setIsBusy] = useState(false);
  const [isFinanceModalOpen, setIsFinanceModalOpen] = useState(false);

  const urgency = notification.urgency ?? 'Low';
  const urgencyStyles = getUrgencyThemeStyles(urgency, isDark);
  const typeMeta = NOTIFICATION_TYPE_CONFIG[notification.type] || {
    label: notification.typeName || 'Notification',
    color: '#6366F1',
    iconName: 'system',
  };

  const isFinanceAlert = notification.type === NotificationType.FinanceAlert || notification.entityReferenceType === 'FinancePeriod';
  let financePayload: {
    missingType?: 'Timesheet' | 'Payroll' | 'Both';
    period?: string;
    year?: number;
    month?: number;
    missingCount?: number;
    missingTimesheetCount?: number;
    missingPayrollCount?: number;
  } | null = null;

  if (notification.payloadJson) {
    try {
      financePayload = JSON.parse(notification.payloadJson);
    } catch {
      // ignore parse error
    }
  }

  const getTypeIcon = () => {
    switch (notification.type) {
      case NotificationType.DocumentExpiry:
        return <DescriptionRounded fontSize="small" />;
      case NotificationType.FinanceAlert:
        return <MonetizationOnRounded fontSize="small" />;
      case NotificationType.EventUpcoming:
        return <EventRounded fontSize="small" />;
      case NotificationType.SystemAnnouncement:
      default:
        return <CampaignRounded fontSize="small" />;
    }
  };

  const handleToggleRead = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isBusy) return;
    setIsBusy(true);
    try {
      if (onToggleRead) {
        await onToggleRead(notification.id);
      } else if (onMarkAsRead) {
        await onMarkAsRead(notification.id);
      }
    } finally {
      setIsBusy(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isBusy) return;
    setIsBusy(true);
    try {
      await onDelete(notification.id);
    } finally {
      setIsBusy(false);
    }
  };

  const isDocumentType = notification.type === NotificationType.DocumentExpiry || notification.entityReferenceType === 'Document';
  const isTimesheetType = notification.entityReferenceType === 'Timesheet' || notification.entityReferenceType === 'TimesheetSummary';
  const isPayrollType = notification.entityReferenceType === 'Payroll';

  const getActionConfig = () => {
    // 1. Finance Missing Records (Aggregated Modal)
    if (isFinanceAlert) {
      return {
        label: financePayload?.missingCount
          ? `View Missing Records (${financePayload.missingCount})`
          : 'View Missing Records',
        icon: <AccountBalanceWalletRounded sx={{ fontSize: '16px !important' }} />,
        variant: 'contained' as const,
        color: 'warning' as const,
        onClick: (e: React.MouseEvent) => {
          e.stopPropagation();
          setIsFinanceModalOpen(true);
        },
      };
    }

    // 1.5. Calendar Events / Public Holidays / Birthdays
    if (
      notification.type === NotificationType.EventUpcoming ||
      notification.entityReferenceType === 'CalendarEvent' ||
      notification.entityReferenceType === 'PublicHoliday' ||
      notification.entityReferenceType === 'Birthday'
    ) {
      return {
        label: 'Open Calendar',
        icon: <EventRounded sx={{ fontSize: '16px !important' }} />,
        variant: 'text' as const,
        color: 'primary' as const,
        onClick: (e: React.MouseEvent) => {
          e.stopPropagation();
          navigate('/calendar');
        },
      };
    }

    // 2. Department Anomaly / Churn
    if (notification.entityReferenceType === 'Department') {
      return {
        label: notification.entityReferenceId ? 'Go to Department' : 'Go to Departments',
        icon: <BusinessRounded sx={{ fontSize: '16px !important' }} />,
        variant: 'text' as const,
        color: 'primary' as const,
        onClick: (e: React.MouseEvent) => {
          e.stopPropagation();
          navigate(
            notification.entityReferenceId
              ? `/departments/${notification.entityReferenceId}`
              : '/departments/list'
          );
        },
      };
    }

    // 3. Year-End Process Milestone
    if (notification.entityReferenceType === 'YearEndProcess') {
      return {
        label: 'Go to Year-End Operations',
        icon: <EventRepeatRounded sx={{ fontSize: '16px !important' }} />,
        variant: 'text' as const,
        color: 'primary' as const,
        onClick: (e: React.MouseEvent) => {
          e.stopPropagation();
          navigate('/settings/year-end');
        },
      };
    }

    // 4. Document Expiry or Mass Document Deletions
    if (isDocumentType) {
      return {
        label: notification.entityReferenceId ? 'Go to Document' : 'Go to Documents Archive',
        icon: notification.entityReferenceId ? (
          <DescriptionRounded sx={{ fontSize: '16px !important' }} />
        ) : (
          <FolderCopyRounded sx={{ fontSize: '16px !important' }} />
        ),
        variant: 'text' as const,
        color: 'primary' as const,
        onClick: (e: React.MouseEvent) => {
          e.stopPropagation();
          navigate(
            notification.entityReferenceId
              ? `/documents/${notification.entityReferenceId}`
              : '/documents/archive'
          );
        },
      };
    }

    // 5. Timesheet Cutoff / Missing Timesheets
    if (isTimesheetType) {
      return {
        label: notification.entityReferenceId ? 'View Employee Timesheet' : 'Go to Timesheets',
        icon: <DateRangeRounded sx={{ fontSize: '16px !important' }} />,
        variant: 'text' as const,
        color: 'primary' as const,
        onClick: (e: React.MouseEvent) => {
          e.stopPropagation();
          navigate(
            notification.entityReferenceId
              ? `/finance/timesheets/${notification.entityReferenceId}`
              : '/finance/timesheets'
          );
        },
      };
    }

    // 6. Payroll Finalization / Frequent Recalculation
    if (isPayrollType) {
      return {
        label: 'Go to Payrolls',
        icon: <MonetizationOnRounded sx={{ fontSize: '16px !important' }} />,
        variant: 'text' as const,
        color: 'primary' as const,
        onClick: (e: React.MouseEvent) => {
          e.stopPropagation();
          navigate('/finance/payrolls');
        },
      };
    }

    // 7. Security Roles & Permission Volatility
    if (notification.entityReferenceType === 'Role' || notification.entityReferenceType === 'RolePermission') {
      return {
        label:
          notification.entityReferenceId && notification.entityReferenceType === 'Role'
            ? 'Go to Role'
            : 'Go to Roles & Permissions',
        icon: <AdminPanelSettingsRounded sx={{ fontSize: '16px !important' }} />,
        variant: 'text' as const,
        color: 'primary' as const,
        onClick: (e: React.MouseEvent) => {
          e.stopPropagation();
          navigate(
            notification.entityReferenceId && notification.entityReferenceType === 'Role'
              ? `/settings/roles/${notification.entityReferenceId}`
              : '/settings/roles'
          );
        },
      };
    }

    // 8. User Account Mutation Spike
    if (notification.entityReferenceType === 'User') {
      return {
        label: notification.entityReferenceId ? 'Go to User' : 'Go to Users',
        icon: notification.entityReferenceId ? (
          <PersonRounded sx={{ fontSize: '16px !important' }} />
        ) : (
          <GroupRounded sx={{ fontSize: '16px !important' }} />
        ),
        variant: 'text' as const,
        color: 'primary' as const,
        onClick: (e: React.MouseEvent) => {
          e.stopPropagation();
          navigate(
            notification.entityReferenceId
              ? `/settings/users/${notification.entityReferenceId}`
              : '/settings/users'
          );
        },
      };
    }

    // 9. Employee Anomaly / Mutation Spike / Events
    if (notification.entityReferenceType === 'Employee') {
      return {
        label: notification.entityReferenceId ? 'Go to Employee' : 'Go to Employees Roster',
        icon: notification.entityReferenceId ? (
          <PersonOutlineRounded sx={{ fontSize: '16px !important' }} />
        ) : (
          <PeopleAltRounded sx={{ fontSize: '16px !important' }} />
        ),
        variant: 'text' as const,
        color: 'primary' as const,
        onClick: (e: React.MouseEvent) => {
          e.stopPropagation();
          navigate(
            notification.entityReferenceId
              ? `/employees/${notification.entityReferenceId}`
              : '/employees/roster'
          );
        },
      };
    }

    // 10. General System Announcement Fallback
    if (notification.type === NotificationType.SystemAnnouncement) {
      return {
        label: 'View System Audit Logs',
        icon: <HistoryRounded sx={{ fontSize: '16px !important' }} />,
        variant: 'text' as const,
        color: 'primary' as const,
        onClick: (e: React.MouseEvent) => {
          e.stopPropagation();
          navigate('/settings/system-logs');
        },
      };
    }

    // 11. Generic Default
    if (notification.entityReferenceId) {
      return {
        label: 'Go to Employee',
        icon: <PersonOutlineRounded sx={{ fontSize: '16px !important' }} />,
        variant: 'text' as const,
        color: 'primary' as const,
        onClick: (e: React.MouseEvent) => {
          e.stopPropagation();
          navigate(`/employees/${notification.entityReferenceId}`);
        },
      };
    }

    return null;
  };

  const actionConfig = getActionConfig();

  const formattedTargetDate = notification.targetDate
    ? parseUtcDate(notification.targetDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : null;

  return (
    <Card
      elevation={0}
      sx={{
        position: 'relative',
        borderRadius: 2.5,
        border: '1px solid',
        borderColor: !notification.isRead
          ? urgencyStyles.border
          : isDark
          ? 'rgba(255, 255, 255, 0.08)'
          : 'rgba(0, 0, 0, 0.08)',
        backgroundColor: !notification.isRead
          ? urgencyStyles.bg
          : isDark
          ? theme.palette.background.paper
          : '#ffffff',
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        overflow: 'hidden',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: isDark
            ? '0 8px 24px rgba(0,0,0,0.35)'
            : '0 8px 24px rgba(0,0,0,0.06)',
          borderColor: urgencyStyles.border,
        },
      }}
    >
      {/* Accent left urgency stripe */}
      <Box
        sx={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 4,
          backgroundColor: urgencyStyles.accentBar,
        }}
      />

      <CardContent sx={{ p: { xs: 2, sm: 2.5 }, pl: { xs: 2.5, sm: 3 } }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
          {/* Main notification content */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            {/* Top metadata tags bar */}
            <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1, mb: 1 }}>
              {/* Unread indicator */}
              {!notification.isRead && (
                <Tooltip title="Unread notification">
                  <FiberManualRecordRounded
                    sx={{
                      fontSize: 12,
                      color: urgencyStyles.accentBar,
                      animation: 'pulse 2s infinite',
                      '@keyframes pulse': {
                        '0%': { opacity: 0.6, transform: 'scale(0.9)' },
                        '50%': { opacity: 1, transform: 'scale(1.2)' },
                        '100%': { opacity: 0.6, transform: 'scale(0.9)' },
                      },
                    }}
                  />
                </Tooltip>
              )}

              {/* Urgency Badge */}
              <Chip
                size="small"
                label={urgency}
                icon={urgency === 'Critical' ? <WarningAmberRounded sx={{ fontSize: '14px !important' }} /> : undefined}
                sx={{
                  fontWeight: 700,
                  fontSize: '0.72rem',
                  letterSpacing: '0.3px',
                  textTransform: 'uppercase',
                  color: '#ffffff',
                  backgroundColor: urgencyStyles.badgeBg,
                  height: 22,
                  boxShadow: urgencyStyles.glow,
                }}
              />

              {/* Type Chip */}
              <Chip
                size="small"
                icon={getTypeIcon()}
                label={typeMeta.label}
                sx={{
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  color: isDark ? '#E2E8F0' : '#334155',
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                  height: 22,
                  '& .MuiChip-icon': {
                    color: typeMeta.color,
                  },
                }}
              />

              {/* Remaining days badge (Only for date-driven alerts, not instant System Announcements) */}
              {notification.type !== NotificationType.SystemAnnouncement &&
                notification.remainingDays !== null &&
                notification.remainingDays !== undefined && (
                  <Chip
                    size="small"
                    icon={<AccessTimeRounded sx={{ fontSize: '14px !important' }} />}
                    label={
                      notification.remainingDays < 0
                        ? `Overdue by ${Math.abs(notification.remainingDays)} day(s)`
                        : notification.remainingDays === 0
                        ? 'Due Today'
                        : `${notification.remainingDays} day(s) left`
                    }
                    sx={{
                      fontWeight: 600,
                      fontSize: '0.75rem',
                      color: urgencyStyles.text,
                      backgroundColor: 'transparent',
                      border: '1px solid',
                      borderColor: urgencyStyles.border,
                      height: 22,
                    }}
                  />
                )}

              {/* Relative timestamp */}
              <Typography
                variant="caption"
                sx={{
                  color: 'text.secondary',
                  fontSize: '0.75rem',
                  ml: 'auto',
                  whiteSpace: 'nowrap',
                }}
              >
                {formatRelativeTime(notification.createdAt)}
              </Typography>
            </Box>

            {/* Notification Title */}
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: notification.isRead ? 600 : 700,
                color: 'text.primary',
                lineHeight: 1.35,
                mb: 0.5,
              }}
            >
              {notification.title}
            </Typography>

            {/* Notification Message */}
            <Typography
              variant="body2"
              sx={{
                color: notification.isRead ? 'text.secondary' : 'text.primary',
                lineHeight: 1.55,
                whiteSpace: 'pre-line',
              }}
            >
              {notification.message}
            </Typography>

            {/* Target Date Details & Quick Navigation Button */}
            <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2, mt: 1.5 }}>
              {notification.type !== NotificationType.SystemAnnouncement && formattedTargetDate && (
                <Typography
                  variant="caption"
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.5,
                    color: 'text.secondary',
                    fontSize: '0.78rem',
                  }}
                >
                  <AccessTimeRounded sx={{ fontSize: 14 }} />
                  Target Date: <strong>{formattedTargetDate}</strong>
                </Typography>
              )}

              {actionConfig && (
                <Button
                  size="small"
                  variant={actionConfig.variant}
                  color={actionConfig.color}
                  startIcon={actionConfig.icon}
                  endIcon={<LaunchRounded sx={{ fontSize: '13px !important' }} />}
                  onClick={actionConfig.onClick}
                  sx={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    textTransform: 'none',
                    py: 0.35,
                    px: 1.25,
                    borderRadius: 1.5,
                    ...(actionConfig.variant === 'contained'
                      ? {
                          boxShadow: 'none',
                          '&:hover': {
                            boxShadow: '0 2px 8px rgba(245, 158, 11, 0.4)',
                          },
                        }
                      : {
                          color: 'primary.main',
                          backgroundColor: isDark ? 'rgba(99, 102, 241, 0.12)' : 'rgba(99, 102, 241, 0.08)',
                          '&:hover': {
                            backgroundColor: isDark ? 'rgba(99, 102, 241, 0.22)' : 'rgba(99, 102, 241, 0.16)',
                          },
                        }),
                  }}
                >
                  {actionConfig.label}
                </Button>
              )}
            </Box>
          </Box>

          {/* Quick Actions right column */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexShrink: 0, ml: 1 }}>
            {/* Dual-function Read / Unread toggle button */}
            <Tooltip title={notification.isRead ? 'Mark as unread' : 'Mark as read'}>
              <IconButton
                size="small"
                onClick={handleToggleRead}
                disabled={disabled || isBusy}
                sx={{
                  color: notification.isRead ? 'text.secondary' : 'primary.main',
                  backgroundColor: notification.isRead
                    ? 'transparent'
                    : isDark
                    ? 'rgba(99, 102, 241, 0.14)'
                    : 'rgba(99, 102, 241, 0.08)',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    color: notification.isRead ? 'primary.main' : 'primary.dark',
                    backgroundColor: isDark ? 'rgba(99, 102, 241, 0.25)' : 'rgba(99, 102, 241, 0.16)',
                    transform: 'scale(1.08)',
                  },
                }}
              >
                {notification.isRead ? (
                  <MarkEmailUnreadRounded fontSize="small" />
                ) : (
                  <CheckCircleOutlineRounded fontSize="small" />
                )}
              </IconButton>
            </Tooltip>

            <Tooltip title="Delete notification">
              <IconButton
                size="small"
                onClick={handleDelete}
                disabled={disabled || isBusy}
                sx={{
                  color: 'text.secondary',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    color: 'error.main',
                    backgroundColor: isDark ? 'rgba(239, 68, 68, 0.18)' : 'rgba(239, 68, 68, 0.08)',
                    transform: 'scale(1.08)',
                  },
                }}
              >
                <DeleteOutlineRounded fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </CardContent>

      {/* Aggregated Missing Records Modal for FinanceAlert */}
      {isFinanceAlert && (
        <FinanceAlertMissingRecordsModal
          open={isFinanceModalOpen}
          onClose={() => setIsFinanceModalOpen(false)}
          year={
            financePayload?.year ||
            (notification.targetDate ? new Date(notification.targetDate).getFullYear() : new Date().getFullYear())
          }
          month={
            financePayload?.month ||
            (notification.targetDate ? new Date(notification.targetDate).getMonth() + 1 : new Date().getMonth() + 1)
          }
          missingType={financePayload?.missingType || 'Both'}
          periodName={financePayload?.period}
        />
      )}
    </Card>
  );
};

