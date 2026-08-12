import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Typography, Box, Skeleton } from '@mui/material';
import { Lock, Event as EventIcon, StickyNote2, Celebration, Cake, CalendarToday } from '@mui/icons-material';
import { useGetDashboardKpisAndEvents } from '../api/dashboardApi';
import { useAuthStore } from '../../../store/useAuthStore';
import { formatEventTimeLabel } from '../../calendar/utils/calendarDateUtils';

export const TodayEventsSection: React.FC = () => {
  const navigate = useNavigate();
  const { hasPermission } = useAuthStore();
  const canReadEmployees = hasPermission('Employees.Read');

  const { data, isLoading, isError } = useGetDashboardKpisAndEvents(canReadEmployees);

  if (!canReadEmployees) return null;

  const todayEvents = data?.todayEvents;
  const hasAnyEvents = todayEvents &&
    (todayEvents.physicalEvents.length > 0 ||
      todayEvents.virtualEvents.length > 0 ||
      todayEvents.notes.length > 0);

  const now = new Date();
  const month = now.toLocaleDateString('en-US', { month: 'short' });
  const day = now.getDate();
  const weekday = now.toLocaleDateString('en-US', { weekday: 'short' });

  const handleNavigateToAgenda = (dateInput?: string) => {
    const d = dateInput ? new Date(dateInput) : new Date();
    const year = d.getFullYear();
    const monthStr = String(d.getMonth() + 1).padStart(2, '0');
    const dayStr = String(d.getDate()).padStart(2, '0');
    const dateStr = `${year}-${monthStr}-${dayStr}`;
    navigate(`/calendar?date=${dateStr}&view=agenda`);
  };

  return (
    <Box sx={{ height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column', borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden', bgcolor: 'background.paper' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2.5, pt: 2, pb: 1.5 }}>
        <CalendarToday sx={{ fontSize: 18, color: 'primary.main' }} />
        <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: '-0.4px', fontSize: '1rem' }}>
          Today's Events
        </Typography>
      </Box>

      {/* Date + Events layout */}
      <Box sx={{ display: 'flex', gap: 0, flexGrow: 1, minHeight: 0, overflow: 'hidden', borderTop: '1px solid', borderColor: 'divider' }}>
        {/* Date Badge (Calendar style, like AgendaView) */}
        <Box 
          onClick={() => handleNavigateToAgenda()}
          sx={{
            flexShrink: 0,
            width: 80,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
            pt: 2,
            pb: 2,
            borderRight: '1px solid',
            borderColor: 'divider',
            bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(99,102,241,0.1)' : 'rgba(79,70,229,0.04)',
            cursor: 'pointer',
            transition: 'background-color 0.15s ease',
            '&:hover': {
              bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(99,102,241,0.2)' : 'rgba(79,70,229,0.08)',
            }
          }}
        >
          <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', color: 'primary.main', fontSize: '0.65rem', letterSpacing: 1 }}>
            {month}
          </Typography>
          <Typography sx={{ fontWeight: 800, fontSize: '2rem', lineHeight: 1, color: 'primary.main' }}>
            {day}
          </Typography>
          <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            {weekday}
          </Typography>
        </Box>

        {/* Events List */}
        <Box sx={{
          flexGrow: 1,
          minHeight: 0,
          overflowY: 'auto',
          p: 1.5,
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          '&::-webkit-scrollbar': { width: 4 },
          '&::-webkit-scrollbar-thumb': { bgcolor: 'divider', borderRadius: 2 },
        }}>
          {isLoading ? (
            <>
              {[1, 2, 3].map(i => (
                <Box key={i} sx={{ display: 'flex', gap: 1.5, alignItems: 'center', p: 1 }}>
                  <Skeleton variant="circular" width={24} height={24} />
                  <Box sx={{ flexGrow: 1 }}>
                    <Skeleton variant="text" width="65%" height={16} />
                    <Skeleton variant="text" width="40%" height={12} />
                  </Box>
                </Box>
              ))}
            </>
          ) : isError ? (
            <Box sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="body2" color="error">Failed to load events.</Typography>
            </Box>
          ) : !hasAnyEvents ? (
            <Box 
              onClick={() => handleNavigateToAgenda()}
              sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 1, color: 'text.secondary', py: 3, cursor: 'pointer' }}
            >
              <CalendarToday sx={{ fontSize: 32, opacity: 0.25 }} />
              <Typography variant="body2" sx={{ fontWeight: 600, opacity: 0.6 }}>No events today</Typography>
              <Typography variant="caption" sx={{ opacity: 0.4 }}>Enjoy your free day!</Typography>
            </Box>
          ) : (
            <>
              {todayEvents.virtualEvents.map((event: any) => (
                <AgendaEventRow
                  key={event.id}
                  title={event.title}
                  subtitle={event.description}
                  color={event.colorCode || '#10B981'}
                  icon={event.type === 1 ? <Celebration sx={{ fontSize: 14 }} /> : <Cake sx={{ fontSize: 14 }} />}
                  onClick={() => handleNavigateToAgenda(event.date)}
                />
              ))}
              {todayEvents.physicalEvents.map((event: any) => {
                const isConf = event.visibilityLevel === 2;
                const timeLabel = formatEventTimeLabel(event);

                return (
                  <AgendaEventRow
                    key={event.id}
                    title={event.title}
                    subtitle={event.departmentName ?? 'Company-wide'}
                    color={isConf ? '#8B5CF6' : '#3B82F6'}
                    icon={isConf ? <Lock sx={{ fontSize: 14 }} /> : <EventIcon sx={{ fontSize: 14 }} />}
                    timeLabel={timeLabel}
                    onClick={() => handleNavigateToAgenda(event.startTime)}
                  />
                );
              })}
              {todayEvents.notes.map((note: any) => (
                <AgendaEventRow
                  key={note.id}
                  title={note.content}
                  subtitle={note.authorName ? `Author: ${note.authorName}` : undefined}
                  color={note.colorCode || '#F59E0B'}
                  icon={note.visibilityLevel === 2 ? <Lock sx={{ fontSize: 14 }} /> : <StickyNote2 sx={{ fontSize: 14 }} />}
                  onClick={() => handleNavigateToAgenda(note.date)}
                />
              ))}
            </>
          )}
        </Box>
      </Box>
    </Box>
  );
};

interface AgendaEventRowProps {
  title: string;
  subtitle?: string;
  color: string;
  icon: React.ReactNode;
  timeLabel?: string;
  onClick?: () => void;
}

const AgendaEventRow: React.FC<AgendaEventRowProps> = ({ title, subtitle, color, icon, timeLabel, onClick }) => (
  <Box
    onClick={onClick}
    sx={{
      display: 'flex',
      alignItems: 'center',
      gap: 1.5,
      px: 1.5,
      py: 1,
      borderRadius: 2,
      borderLeft: `3px solid ${color}`,
      bgcolor: `${color}0D`,
      transition: 'all 0.15s ease',
      cursor: 'pointer',
      '&:hover': {
        bgcolor: `${color}18`,
        transform: 'translateX(2px)',
      },
    }}
  >
    <Box sx={{ color, display: 'flex', flexShrink: 0 }}>{icon}</Box>
    <Box sx={{ minWidth: 0, flexGrow: 1 }}>
      <Typography
        variant="caption"
        sx={{
          fontWeight: 700,
          display: 'block',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          color: 'text.primary',
          fontSize: '0.78rem',
        }}
      >
        {title}
      </Typography>
      {timeLabel && (
        <Typography
          variant="caption"
          sx={{
            display: 'block',
            color: color,
            fontWeight: 600,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            fontSize: '0.65rem',
            mt: 0.2,
          }}
        >
          {timeLabel}
        </Typography>
      )}
      {subtitle && (
        <Typography
          variant="caption"
          sx={{
            display: 'block',
            color: 'text.secondary',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            fontSize: '0.7rem',
            mt: timeLabel ? 0.2 : 0,
          }}
        >
          {subtitle}
        </Typography>
      )}
    </Box>
  </Box>
);
