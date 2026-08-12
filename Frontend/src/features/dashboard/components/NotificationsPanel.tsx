import React from 'react';
import { Typography, Box, Skeleton, Divider, Chip, useTheme } from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import EventIcon from '@mui/icons-material/Event';
import DescriptionIcon from '@mui/icons-material/Description';
import CampaignIcon from '@mui/icons-material/Campaign';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useNavigate } from 'react-router-dom';
import { useGetDashboardKpisAndEvents } from '../api/dashboardApi';
import { useAuthStore } from '../../../store/useAuthStore';
import type { DashboardNotificationDto } from '../api/dashboardApi';
import {
  calculateNotificationUrgency,
  getUrgencyThemeStyles,
  formatRelativeTime,
} from '../../notifications/utils/urgencyUtils';

interface NotificationStyle {
  color: string;
  bgColor: string;
  icon: React.ReactNode;
  label: string;
  typeParam: number;
}

const getBaseStyle = (type: number): NotificationStyle => {
  switch (type) {
    case 1: // DocumentExpiry
      return { color: '#8B5CF6', bgColor: 'rgba(139,92,246,0.08)', icon: <DescriptionIcon sx={{ fontSize: 16 }} />, label: 'Document', typeParam: 1 };
    case 2: // FinanceAlert
      return { color: '#F59E0B', bgColor: 'rgba(245,158,11,0.08)', icon: <AttachMoneyIcon sx={{ fontSize: 16 }} />, label: 'Finance', typeParam: 2 };
    case 3: // SystemAnnouncement
      return { color: '#0EA5E9', bgColor: 'rgba(14,165,233,0.08)', icon: <CampaignIcon sx={{ fontSize: 16 }} />, label: 'System', typeParam: 3 };
    case 4: // EventUpcoming
      return { color: '#10B981', bgColor: 'rgba(16,185,129,0.08)', icon: <EventIcon sx={{ fontSize: 16 }} />, label: 'Event', typeParam: 4 };
    default:
      return { color: '#6B7280', bgColor: 'rgba(107,114,128,0.08)', icon: <NotificationsIcon sx={{ fontSize: 16 }} />, label: 'Info', typeParam: 0 };
  }
};

export const NotificationsPanel: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { hasPermission } = useAuthStore();
  const navigate = useNavigate();
  const canReadEmployees = hasPermission('Employees.Read');

  const { data, isLoading, isError } = useGetDashboardKpisAndEvents(canReadEmployees);

  if (!canReadEmployees) return null;

  const notifications = data?.topNotifications || [];

  const handleNotifClick = (notif: DashboardNotificationDto) => {
    // Navigate to notifications page with type filter as query param
    navigate(`/notifications?type=${notif.type}`);
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden', bgcolor: 'background.paper' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2.5, pt: 2, pb: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <NotificationsIcon sx={{ fontSize: 18, color: 'primary.main' }} />
          <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: '-0.4px', fontSize: '1rem' }}>
            Notifications
          </Typography>
        </Box>
        {notifications.length > 0 && (
          <Box
            onClick={() => navigate('/notifications')}
            sx={{
              display: 'flex', alignItems: 'center', gap: 0.3,
              cursor: 'pointer',
              color: 'primary.main',
              fontSize: '0.75rem',
              fontWeight: 600,
              opacity: 0.7,
              '&:hover': { opacity: 1 },
            }}
          >
            See all <ChevronRightIcon sx={{ fontSize: 14 }} />
          </Box>
        )}
      </Box>
      <Divider />

      {/* Content */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto', '&::-webkit-scrollbar': { width: 4 }, '&::-webkit-scrollbar-thumb': { bgcolor: 'divider', borderRadius: 2 } }}>
        {isLoading ? (
          <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {[1, 2, 3].map(i => (
              <Box key={i} sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                <Skeleton variant="rounded" width={28} height={28} />
                <Box sx={{ flexGrow: 1 }}>
                  <Skeleton variant="text" width="60%" height={14} />
                  <Skeleton variant="text" width="85%" height={12} />
                </Box>
              </Box>
            ))}
          </Box>
        ) : isError ? (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="error">Failed to load notifications.</Typography>
          </Box>
        ) : notifications.length === 0 ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 1, color: 'text.secondary', py: 4 }}>
            <NotificationsIcon sx={{ fontSize: 32, opacity: 0.25 }} />
            <Typography variant="body2" sx={{ fontWeight: 600, opacity: 0.6 }}>All caught up!</Typography>
            <Typography variant="caption" sx={{ opacity: 0.4 }}>No notifications available</Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            {notifications.map((notif, index) => {
              const urgency = calculateNotificationUrgency(
                notif.remainingDays,
                notif.targetDate,
                30,
                notif.type as any,
                notif.payloadJson
              );
              const urgencyStyles = getUrgencyThemeStyles(urgency, isDark);
              const baseStyle = getBaseStyle(notif.type);

              return (
                <React.Fragment key={notif.id}>
                  <Box
                    onClick={() => handleNotifClick(notif)}
                    sx={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 1.5,
                      px: 2,
                      py: 1.5,
                      cursor: 'pointer',
                      opacity: notif.isRead ? 0.75 : 1,
                      transition: 'background-color 0.15s ease, opacity 0.15s ease',
                      '&:hover': { bgcolor: baseStyle.bgColor, opacity: 1 },
                    }}
                  >
                    {/* Type Icon Badge */}
                    <Box sx={{
                      flexShrink: 0,
                      width: 32,
                      height: 32,
                      borderRadius: 2,
                      bgcolor: baseStyle.bgColor,
                      color: baseStyle.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: `1.5px solid ${baseStyle.color}30`,
                      mt: 0.2
                    }}>
                      {baseStyle.icon}
                    </Box>

                    {/* Text & Content */}
                    <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 0.8, mb: 0.4 }}>
                        <Typography
                          variant="caption"
                          sx={{
                            fontWeight: notif.isRead ? 600 : 700,
                            fontSize: '0.78rem',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            color: 'text.primary'
                          }}
                        >
                          {notif.title}
                        </Typography>

                        {/* Urgency Badge (Critical, High, Moderate, Low) matching NotificationsPage */}
                        <Chip
                          size="small"
                          label={urgency.toUpperCase()}
                          sx={{
                            flexShrink: 0,
                            height: 18,
                            fontSize: '0.6rem',
                            fontWeight: 700,
                            letterSpacing: '0.4px',
                            color: '#ffffff',
                            backgroundColor: urgencyStyles.badgeBg,
                            boxShadow: urgencyStyles.glow,
                            '& .MuiChip-label': { px: 0.8, py: 0 }
                          }}
                        />
                      </Box>

                      <Typography
                        variant="caption"
                        sx={{
                          color: 'text.secondary',
                          fontSize: '0.7rem',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          lineHeight: 1.4
                        }}
                      >
                        {notif.message}
                      </Typography>

                      <Typography
                        variant="caption"
                        sx={{ color: 'text.disabled', fontSize: '0.65rem', mt: 0.4, display: 'block' }}
                      >
                        {formatRelativeTime(notif.createdAt)}
                      </Typography>
                    </Box>

                    <ChevronRightIcon sx={{ fontSize: 14, color: 'text.disabled', flexShrink: 0, mt: 0.5 }} />
                  </Box>
                  {index < notifications.length - 1 && <Divider />}
                </React.Fragment>
              );
            })}
          </Box>
        )}
      </Box>
    </Box>
  );
};

