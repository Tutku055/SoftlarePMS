import React, { useState } from 'react';
import {
  Box,
  Button,
  IconButton,
  Typography,
  ToggleButtonGroup,
  ToggleButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
} from '@mui/material';
import {
  ChevronLeft,
  ChevronRight,
  Today,
  Add,
  Event as EventIcon,
  NoteAlt,
  Settings as SettingsIcon,
  Menu as MenuIcon,
  CalendarViewMonth,
  CalendarViewWeek,
  CalendarViewDay,
  ViewAgenda,
} from '@mui/icons-material';
import type { CalendarViewMode } from '../types/calendar.types';
import { formatRangeLabel } from '../utils/calendarDateUtils';
import { useAuthStore } from '../../../store/useAuthStore';
import styles from './Calendar.module.css';

interface CalendarHeaderProps {
  currentDate: Date;
  viewMode: CalendarViewMode;
  onViewModeChange: (mode: CalendarViewMode) => void;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onOpenCreateEvent: () => void;
  onOpenCreateNote: () => void;
  onOpenSettings: () => void;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  currentDate,
  viewMode,
  onViewModeChange,
  onPrev,
  onNext,
  onToday,
  onOpenCreateEvent,
  onOpenCreateNote,
  onOpenSettings,
  isSidebarOpen,
  onToggleSidebar,
}) => {
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const canCreateEvent = hasPermission('Calendar.CreateEvent') || hasPermission('Calendar.CreateConfidentialEvents');
  const canCreateNote = hasPermission('Calendar.CreateNote') || hasPermission('Calendar.CreateConfidentialNotes');
  const canManageSettings = hasPermission('Calendar.ManageSettings');

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleCreateClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const handleCreateEvent = () => {
    handleCloseMenu();
    onOpenCreateEvent();
  };

  const handleCreateNote = () => {
    handleCloseMenu();
    onOpenCreateNote();
  };

  return (
    <Box className={styles.headerBar}>
      {/* Left: Sidebar toggle, Today, Nav Arrows, Range Title */}
      <Box className={styles.navGroup}>
        <Tooltip title={isSidebarOpen ? 'Hide sidebar' : 'Show sidebar'}>
          <IconButton onClick={onToggleSidebar} size="small" sx={{ mr: 0.5 }}>
            <MenuIcon />
          </IconButton>
        </Tooltip>

        <Button
          variant="outlined"
          size="small"
          startIcon={<Today />}
          onClick={onToday}
          sx={{
            borderRadius: 2,
            px: 1.5,
            fontWeight: 600,
            textTransform: 'none',
          }}
        >
          Today
        </Button>

        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Tooltip title="Previous">
            <IconButton onClick={onPrev} size="small">
              <ChevronLeft />
            </IconButton>
          </Tooltip>
          <Tooltip title="Next">
            <IconButton onClick={onNext} size="small">
              <ChevronRight />
            </IconButton>
          </Tooltip>
        </Box>

        <Typography className={styles.rangeTitle} color="text.primary">
          {formatRangeLabel(viewMode, currentDate)}
        </Typography>
      </Box>

      {/* Right: View mode toggle, + Create Button, Settings button */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <ToggleButtonGroup
          value={viewMode}
          exclusive
          onChange={(_, newMode) => {
            if (newMode) onViewModeChange(newMode);
          }}
          size="small"
          sx={{
            '& .MuiToggleButton-root': {
              px: 1.5,
              py: 0.5,
              textTransform: 'none',
              fontWeight: 500,
              fontSize: '0.82rem',
              display: 'flex',
              gap: 0.5,
            },
          }}
        >
          <ToggleButton value="month">
            <CalendarViewMonth fontSize="small" />
            <Box component="span" sx={{ display: { xs: 'none', md: 'inline' } }}>Month</Box>
          </ToggleButton>
          <ToggleButton value="week">
            <CalendarViewWeek fontSize="small" />
            <Box component="span" sx={{ display: { xs: 'none', md: 'inline' } }}>Week</Box>
          </ToggleButton>
          <ToggleButton value="day">
            <CalendarViewDay fontSize="small" />
            <Box component="span" sx={{ display: { xs: 'none', md: 'inline' } }}>Day</Box>
          </ToggleButton>
          <ToggleButton value="agenda">
            <ViewAgenda fontSize="small" />
            <Box component="span" sx={{ display: { xs: 'none', md: 'inline' } }}>Agenda</Box>
          </ToggleButton>
        </ToggleButtonGroup>

        {(canCreateEvent || canCreateNote) && (
          <>
            <Button
              variant="contained"
              color="primary"
              size="small"
              startIcon={<Add />}
              onClick={handleCreateClick}
              sx={{
                borderRadius: 2,
                fontWeight: 600,
                px: 2,
                boxShadow: '0 4px 14px rgba(79, 70, 229, 0.3)',
              }}
            >
              Create
            </Button>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleCloseMenu}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              slotProps={{
                paper: {
                  sx: { borderRadius: 2, minWidth: 160, mt: 1 },
                },
              }}
            >
              {canCreateEvent && (
                <MenuItem onClick={handleCreateEvent}>
                  <ListItemIcon>
                    <EventIcon fontSize="small" sx={{ color: '#3B82F6' }} />
                  </ListItemIcon>
                  <ListItemText primary="Event" />
                </MenuItem>
              )}
              {canCreateNote && (
                <MenuItem onClick={handleCreateNote}>
                  <ListItemIcon>
                    <NoteAlt fontSize="small" sx={{ color: '#F59E0B' }} />
                  </ListItemIcon>
                  <ListItemText primary="Personal Note" />
                </MenuItem>
              )}
            </Menu>
          </>
        )}

        {canManageSettings && (
          <Tooltip title="Calendar Settings">
            <IconButton onClick={onOpenSettings} size="small" color="inherit">
              <SettingsIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>
    </Box>
  );
};
