import React, { useState } from 'react';
import { Box, Typography, Card, Popover, MenuList, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import { Lock, Event as EventIcon } from '@mui/icons-material';
import type { CalendarEventDto } from '../../types/calendar.types';
import { formatTimeDisplay } from '../../utils/calendarDateUtils';

interface EventStackProps {
  events: (CalendarEventDto & { startMin: number; endMin: number; lane: number; laneCount: number })[];
  onSelectEvent: (event: CalendarEventDto) => void;
  slotHeight: number;
  isWeekView?: boolean;
}

export const EventStack: React.FC<EventStackProps> = ({ events, onSelectEvent, slotHeight, isWeekView }) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  // events[0] is the "active" (most recently added) event to show
  const activeEvent = events[0];
  if (!activeEvent) return null;
  
  const isConf = activeEvent.visibilityLevel === 2;
  const hiddenCount = events.length - 1;

  // Use the widest time range across all events in this stack for positioning
  const minStart = Math.min(...events.map(e => e.startMin));
  const maxEnd = Math.max(...events.map(e => e.endMin));
  const top = (minStart / 60) * slotHeight;
  const height = Math.max(isWeekView ? 20 : 30, ((maxEnd - minStart) / 60) * slotHeight);
  
  // Calculate horizontal position based on lane
  const laneWidth = 100 / activeEvent.laneCount;
  const laneInset = activeEvent.laneCount > 1 ? (isWeekView ? 2 : 3) : (isWeekView ? 3 : 8);
  const left = isWeekView && activeEvent.laneCount === 1 ? 3 : (activeEvent.laneCount > 1 ? `calc(${activeEvent.lane * laneWidth}% + ${laneInset}px)` : (isWeekView ? 3 : 8));
  const right = isWeekView && activeEvent.laneCount === 1 ? 3 : (activeEvent.laneCount > 1 ? `calc(${(activeEvent.laneCount - activeEvent.lane - 1) * laneWidth}% + ${laneInset}px)` : (isWeekView ? 3 : 8));

  // Badge text based on type
  const badgeText = `+${hiddenCount} more`;

  const handleOpenMore = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    setAnchorEl(e.currentTarget);
  };

  const handleCloseMore = (e: React.MouseEvent) => {
    e.stopPropagation();
    setAnchorEl(null);
  };

  const handleSelectFromMore = (e: React.MouseEvent, evt: CalendarEventDto) => {
    e.stopPropagation();
    setAnchorEl(null);
    onSelectEvent(evt);
  };

  // Popover header based on the type of events in this stack
  const popoverTitle = isConf ? 'Confidential Events' : 'Company Events';
  const popoverColor = isConf ? '#7C3AED' : undefined;

  return (
    <>
      <Card
        sx={{
          position: 'absolute',
          top: `${top}px`,
          height: `${height}px`,
          left,
          right,
          bgcolor: isConf ? '#7C3AED' : 'primary.main',
          color: '#fff',
          borderRadius: 1.5,
          p: isWeekView ? '2px 4px' : '4px 8px',
          cursor: 'pointer',
          boxShadow: '0 3px 12px rgba(0,0,0,0.15)',
          zIndex: 10 + activeEvent.lane,
          overflow: 'hidden',
          boxSizing: 'border-box',
          transition: 'all 0.15s ease',
          display: 'flex',
          flexDirection: 'column',
          '&:hover': {
            transform: 'scale(1.01)',
            zIndex: 20 + activeEvent.lane,
          }
        }}
        onClick={(e) => {
          e.stopPropagation();
          onSelectEvent(activeEvent);
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: isWeekView ? 0.5 : 1, pr: hiddenCount > 0 ? (isWeekView ? 4 : 5) : 0 }}>
          {isConf ? <Lock sx={{ fontSize: isWeekView ? 11 : 16 }} /> : (!isWeekView && <EventIcon sx={{ fontSize: 16 }} />)}
          <Typography variant="body2" sx={{ fontWeight: 700, fontSize: isWeekView ? '0.68rem' : '0.82rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.1 }}>
            {activeEvent.title}
          </Typography>
          {!isWeekView && (
            <Typography variant="caption" sx={{ opacity: 0.85, ml: 'auto', fontSize: '0.72rem', flexShrink: 0 }}>
              {formatTimeDisplay(activeEvent.startTime)} – {formatTimeDisplay(activeEvent.endTime)}
            </Typography>
          )}
        </Box>

        {isWeekView && (
          <Typography sx={{ fontSize: '0.62rem', opacity: 0.85, lineHeight: 1, mt: 0.25 }}>
            {formatTimeDisplay(activeEvent.startTime)} – {formatTimeDisplay(activeEvent.endTime)}
          </Typography>
        )}

        {activeEvent.description && !isWeekView && (
          <Typography variant="caption" sx={{ opacity: 0.9, mt: 0.25, display: 'block', fontSize: '0.72rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {activeEvent.description}
          </Typography>
        )}

        {/* +N More Badge — only show when there are hidden events */}
        {hiddenCount > 0 && (
          <Box
            sx={{
              position: 'absolute',
              top: isWeekView ? 2 : 4,
              right: isWeekView ? 2 : 4,
              display: 'flex',
              alignItems: 'center',
              gap: 0.3,
              bgcolor: isConf ? 'rgba(91, 33, 182, 0.7)' : 'rgba(0,0,0,0.4)',
              borderRadius: 1,
              px: 0.5,
              py: 0.25,
              backdropFilter: 'blur(4px)',
              '&:hover': {
                bgcolor: isConf ? 'rgba(91, 33, 182, 0.9)' : 'rgba(0,0,0,0.6)',
              }
            }}
            onClick={handleOpenMore}
          >
            {isConf && <Lock sx={{ fontSize: isWeekView ? 8 : 10, color: '#fff' }} />}
            <Typography variant="caption" sx={{ fontSize: isWeekView ? '0.55rem' : '0.65rem', fontWeight: 700, color: '#fff' }}>
              {badgeText}
            </Typography>
          </Box>
        )}
      </Card>

      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handleCloseMore}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        slotProps={{
          paper: {
            sx: { mt: 0.5, boxShadow: '0 8px 32px rgba(0,0,0,0.2)', borderRadius: 2, minWidth: 240, maxWidth: 320, zIndex: 1300 }
          }
        }}
        sx={{ zIndex: 1300 }}
        onClick={(e) => e.stopPropagation()}
      >
        <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', bgcolor: isConf ? 'rgba(124, 58, 237, 0.05)' : 'background.default' }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: popoverColor }}>
            {popoverTitle}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {events.length} events at this time
          </Typography>
        </Box>
        <MenuList sx={{ p: 0, maxHeight: 300, overflow: 'auto' }}>
          {events.map((evt, idx) => (
            <MenuItem 
              key={evt.id} 
              onClick={(e) => handleSelectFromMore(e, evt)}
              sx={{ borderBottom: idx < events.length - 1 ? '1px solid' : 'none', borderColor: 'divider', py: 1 }}
            >
              <ListItemIcon sx={{ minWidth: 28 }}>
                {isConf ? <Lock sx={{ fontSize: 18, color: '#7C3AED' }} /> : <EventIcon sx={{ fontSize: 18, color: 'primary.main' }} />}
              </ListItemIcon>
              <ListItemText 
                primary={
                  <Typography variant="body2" sx={{ fontWeight: 600, color: popoverColor }} noWrap>
                    {evt.title}
                  </Typography>
                }
                secondary={
                  <Typography variant="caption">
                    {formatTimeDisplay(evt.startTime)} – {formatTimeDisplay(evt.endTime)}
                  </Typography>
                }
              />
            </MenuItem>
          ))}
        </MenuList>
      </Popover>
    </>
  );
};
