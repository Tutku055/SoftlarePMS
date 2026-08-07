import React, { useState } from 'react';
import {
  Box,
  Typography,
  Popover,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Lock,
  Event as EventIcon,
  Celebration,
  Cake,
  StickyNote2,
} from '@mui/icons-material';
import type {
  CalendarDayDto,
  CalendarFilters,
  CalendarEventDto,
  CalendarNoteDto,
  VirtualCalendarEventDto,
} from '../../types/calendar.types';
import { formatDateToIso, formatTimeDisplay } from '../../utils/calendarDateUtils';
import styles from '../Calendar.module.css';

interface MonthViewProps {
  dates: Date[];
  currentMonth: number;
  calendarData: CalendarDayDto[];
  filters: CalendarFilters;
  onSelectEvent: (event: CalendarEventDto) => void;
  onSelectNote: (note: CalendarNoteDto) => void;
  onSelectVirtualEvent: (vEvent: VirtualCalendarEventDto) => void;
  onCellClick: (date: string) => void;
}

export const MonthView: React.FC<MonthViewProps> = ({
  dates,
  currentMonth,
  calendarData,
  filters,
  onSelectEvent,
  onSelectNote,
  onSelectVirtualEvent,
  onCellClick,
}) => {
  const [popoverAnchor, setPopoverAnchor] = useState<HTMLElement | null>(null);
  const [popoverDay, setPopoverDay] = useState<CalendarDayDto | null>(null);

  // Map calendarData by date string for O(1) lookup
  const dataMap = new Map<string, CalendarDayDto>();
  calendarData.forEach((day) => {
    dataMap.set(day.date, day);
  });

  const handleOpenMore = (e: React.MouseEvent<HTMLElement>, day: CalendarDayDto) => {
    e.stopPropagation();
    setPopoverAnchor(e.currentTarget);
    setPopoverDay(day);
  };

  const handleClosePopover = () => {
    setPopoverAnchor(null);
    setPopoverDay(null);
  };

  const weekHeaders = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <Box className={styles.monthGridContainer}>
      {/* Weekday headers */}
      <Box className={styles.weekHeaderRow}>
        {weekHeaders.map((day, idx) => (
          <Box key={idx} sx={{ color: idx >= 5 ? 'text.secondary' : 'text.primary' }}>
            {day}
          </Box>
        ))}
      </Box>

      {/* Grid */}
      <Box className={styles.monthGrid}>
        {dates.map((date, idx) => {
          const isoDate = formatDateToIso(date);
          const dayData = dataMap.get(isoDate);
          const isOtherMonth = date.getMonth() !== currentMonth;
          const isWeekend = date.getDay() === 0 || date.getDay() === 6;
          const isToday = dayData?.isToday ?? false;

          // Collect visible items
          const items: Array<{
            key: string;
            type: 'event' | 'note' | 'holiday' | 'birthday';
            title: string;
            time?: string;
            color: string;
            rawItem: any;
            isConfidential?: boolean;
          }> = [];

          if (dayData) {
            // Holidays
            if (filters.showHolidays) {
              dayData.virtualEvents
                ?.filter((v) => v.type === 1)
                .forEach((h) => {
                  items.push({
                    key: h.id,
                    type: 'holiday',
                    title: h.title,
                    color: h.colorCode || '#10B981',
                    rawItem: h,
                  });
                });
            }

            // Birthdays
            if (filters.showBirthdays) {
              dayData.virtualEvents
                ?.filter((v) => v.type === 2)
                .forEach((b) => {
                  items.push({
                    key: b.id,
                    type: 'birthday',
                    title: b.title,
                    color: b.colorCode || '#EC4899',
                    rawItem: b,
                  });
                });
            }

            // Physical Events
            if (filters.showPhysicalEvents) {
              dayData.physicalEvents?.forEach((e) => {
                items.push({
                  key: e.id,
                  type: 'event',
                  title: e.title,
                  time: formatTimeDisplay(e.startTime),
                  color: '#3B82F6',
                  rawItem: e,
                });
              });
            }

            // Notes
            if (filters.showNotes) {
              dayData.notes?.forEach((n) => {
                items.push({
                  key: n.id,
                  type: 'note',
                  title: n.content,
                  color: n.colorCode || '#F59E0B',
                  rawItem: n,
                  isConfidential: n.visibilityLevel === 2,
                });
              });
            }
          }

          const visibleItems = items.slice(0, 3);
          const overflowCount = items.length - visibleItems.length;

          return (
            <Box
              key={idx}
              className={`${styles.monthCell} ${isOtherMonth ? styles.otherMonthCell : ''} ${
                isWeekend ? styles.weekendCell : ''
              }`}
              onClick={() => onCellClick(isoDate)}
            >
              <Box className={styles.cellHeader}>
                <Box
                  className={`${styles.dayNumber} ${isToday ? styles.todayNumber : ''}`}
                  sx={{ color: isToday ? '#fff' : isOtherMonth ? 'text.disabled' : 'text.primary' }}
                >
                  {date.getDate()}
                </Box>
              </Box>

              <Box className={styles.cellItemsList}>
                {visibleItems.map((item) => (
                  <Box
                    key={item.key}
                    className={styles.eventChip}
                    style={{
                      backgroundColor: `${item.color}22`,
                      borderLeftColor: item.color,
                      color: item.color,
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (item.type === 'event') onSelectEvent(item.rawItem);
                      else if (item.type === 'note') onSelectNote(item.rawItem);
                      else onSelectVirtualEvent(item.rawItem);
                    }}
                  >
                    {item.type === 'holiday' && <Celebration sx={{ fontSize: 12 }} />}
                    {item.type === 'birthday' && <Cake sx={{ fontSize: 12 }} />}
                    {item.type === 'event' && <EventIcon sx={{ fontSize: 12 }} />}
                    {item.type === 'note' && (
                      item.isConfidential ? <Lock sx={{ fontSize: 12 }} /> : <StickyNote2 sx={{ fontSize: 12 }} />
                    )}
                    {item.time && (
                      <Typography component="span" sx={{ fontSize: '0.7rem', fontWeight: 700, mr: 0.3 }}>
                        {item.time}
                      </Typography>
                    )}
                    <Typography
                      component="span"
                      sx={{
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {item.title}
                    </Typography>
                  </Box>
                ))}

                {overflowCount > 0 && dayData && (
                  <Box
                    className={styles.moreBadge}
                    onClick={(e) => handleOpenMore(e, dayData)}
                  >
                    +{overflowCount} more
                  </Box>
                )}
              </Box>
            </Box>
          );
        })}
      </Box>

      {/* Overflow popover */}
      <Popover
        open={Boolean(popoverAnchor)}
        anchorEl={popoverAnchor}
        onClose={handleClosePopover}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        slotProps={{
          paper: {
            sx: {
              borderRadius: 2,
              p: 1.5,
              minWidth: 260,
              maxWidth: 320,
              boxShadow: 6,
              bgcolor: 'background.paper',
              backgroundImage: 'none',
            },
          },
        }}
      >
        {popoverDay && (
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
              {popoverDay.date} ({popoverDay.dayOfWeek})
            </Typography>
            <List dense disablePadding sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              {filters.showHolidays &&
                popoverDay.virtualEvents
                  ?.filter((v) => v.type === 1)
                  .map((h) => (
                    <ListItem key={h.id} disablePadding>
                      <ListItemButton
                        onClick={() => {
                          handleClosePopover();
                          onSelectVirtualEvent(h);
                        }}
                        sx={{ borderRadius: 1, py: 0.5, bgcolor: '#10B98122' }}
                      >
                        <ListItemIcon sx={{ minWidth: 28, color: '#10B981' }}>
                          <Celebration fontSize="small" />
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#10B981' }}>
                              {h.title}
                            </Typography>
                          }
                        />
                      </ListItemButton>
                    </ListItem>
                  ))}

              {filters.showBirthdays &&
                popoverDay.virtualEvents
                  ?.filter((v) => v.type === 2)
                  .map((b) => (
                    <ListItem key={b.id} disablePadding>
                      <ListItemButton
                        onClick={() => {
                          handleClosePopover();
                          onSelectVirtualEvent(b);
                        }}
                        sx={{ borderRadius: 1, py: 0.5, bgcolor: '#EC489922' }}
                      >
                        <ListItemIcon sx={{ minWidth: 28, color: '#EC4899' }}>
                          <Cake fontSize="small" />
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#EC4899' }}>
                              {b.title}
                            </Typography>
                          }
                        />
                      </ListItemButton>
                    </ListItem>
                  ))}

              {filters.showPhysicalEvents &&
                popoverDay.physicalEvents?.map((e) => (
                  <ListItem key={e.id} disablePadding>
                    <ListItemButton
                      onClick={() => {
                        handleClosePopover();
                        onSelectEvent(e);
                      }}
                      sx={{ borderRadius: 1, py: 0.5, bgcolor: '#3B82F622' }}
                    >
                      <ListItemIcon sx={{ minWidth: 28, color: '#3B82F6' }}>
                        <EventIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#3B82F6' }}>
                            {formatTimeDisplay(e.startTime)} {e.title}
                          </Typography>
                        }
                      />
                    </ListItemButton>
                  </ListItem>
                ))}

              {filters.showNotes &&
                popoverDay.notes?.map((n) => (
                  <ListItem key={n.id} disablePadding>
                    <ListItemButton
                      onClick={() => {
                        handleClosePopover();
                        onSelectNote(n);
                      }}
                      sx={{ borderRadius: 1, py: 0.5, bgcolor: `${n.colorCode}22` }}
                    >
                      <ListItemIcon sx={{ minWidth: 28, color: n.colorCode }}>
                        {n.visibilityLevel === 2 ? <Lock fontSize="small" /> : <StickyNote2 fontSize="small" />}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: n.colorCode }}>
                            {n.content}
                          </Typography>
                        }
                      />
                    </ListItemButton>
                  </ListItem>
                ))}
            </List>
          </Box>
        )}
      </Popover>
    </Box>
  );
};
