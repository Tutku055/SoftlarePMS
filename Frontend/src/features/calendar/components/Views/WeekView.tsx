import React, { useEffect, useRef } from 'react';
import { Box, Typography } from '@mui/material';
import {
  Lock,
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

interface WeekViewProps {
  dates: Date[];
  calendarData: CalendarDayDto[];
  filters: CalendarFilters;
  onSelectEvent: (event: CalendarEventDto) => void;
  onSelectNote: (note: CalendarNoteDto) => void;
  onSelectVirtualEvent: (vEvent: VirtualCalendarEventDto) => void;
  onTimeSlotClick: (date: string, hour: number) => void;
}

const SLOT_HEIGHT = 48; // Compact 48px per hour for perfect screen fit

export const WeekView: React.FC<WeekViewProps> = ({
  dates,
  calendarData,
  filters,
  onSelectEvent,
  onSelectNote,
  onSelectVirtualEvent,
  onTimeSlotClick,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to 08:00 AM on initial load
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 8 * SLOT_HEIGHT - 16;
    }
  }, []);

  const dataMap = new Map<string, CalendarDayDto>();
  calendarData.forEach((day) => {
    dataMap.set(day.date, day);
  });

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const today = new Date();
  const todayIso = formatDateToIso(today);
  const currentMinutesFromMidnight = today.getHours() * 60 + today.getMinutes();

  return (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Fixed Top Section: Day Names Header + All-day Row */}
      <Box sx={{ display: 'flex', flexDirection: 'column', borderBottom: '1px solid rgba(140, 140, 160, 0.18)' }}>
        
        {/* 7-Day Header */}
        <Box sx={{ display: 'flex', alignItems: 'stretch' }}>
          {/* Time Gutter Left Spacer */}
          <Box className={styles.timeGutter} sx={{ borderRight: '1px solid rgba(140, 140, 160, 0.15)' }} />

          {/* 7 Column Headers */}
          <Box sx={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', minWidth: 0 }}>
            {dates.map((d, idx) => {
              const iso = formatDateToIso(d);
              const isToday = iso === todayIso;
              const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

              return (
                <Box
                  key={idx}
                  sx={{
                    py: 0.5,
                    textAlign: 'center',
                    borderRight: idx < 6 ? '1px solid rgba(140, 140, 160, 0.12)' : 'none',
                    minWidth: 0,
                  }}
                >
                  <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.68rem' }}>
                    {dayNames[idx]}
                  </Typography>
                  <Box
                    sx={{
                      width: 26,
                      height: 26,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mx: 'auto',
                      mt: 0.25,
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      bgcolor: isToday ? 'primary.main' : 'transparent',
                      color: isToday ? '#fff' : 'text.primary',
                    }}
                  >
                    {d.getDate()}
                  </Box>
                </Box>
              );
            })}
          </Box>

          {/* Scroll Gutter Spacer to match scrollbar width */}
          <Box className={styles.scrollGutterSpacer} />
        </Box>

        {/* All-Day / Virtual Events Header Row */}
        <Box sx={{ display: 'flex', alignItems: 'stretch', borderTop: '1px solid rgba(140, 140, 160, 0.12)', bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'rgba(140, 140, 160, 0.03)' }}>
          <Box className={styles.timeGutter} sx={{ p: 0.5, textAlign: 'right', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.62rem', fontWeight: 600 }}>
              all-day
            </Typography>
          </Box>

          <Box sx={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', minWidth: 0 }}>
            {dates.map((d, idx) => {
              const iso = formatDateToIso(d);
              const dayData = dataMap.get(iso);

              return (
                <Box
                  key={idx}
                  sx={{
                    p: 0.5,
                    borderRight: idx < 6 ? '1px solid rgba(140, 140, 160, 0.12)' : 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 0.25,
                    minHeight: 30,
                    minWidth: 0,
                    overflow: 'hidden',
                  }}
                >
                  {/* Holidays */}
                  {filters.showHolidays &&
                    dayData?.virtualEvents
                      ?.filter((v) => v.type === 1)
                      .map((h) => (
                        <Box
                          key={h.id}
                          className={styles.eventChip}
                          style={{ backgroundColor: '#10B98122', borderLeftColor: '#10B981', color: '#10B981' }}
                          onClick={() => onSelectVirtualEvent(h)}
                        >
                          <Celebration sx={{ fontSize: 11 }} />
                          <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.68rem', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {h.title}
                          </Typography>
                        </Box>
                      ))}

                  {/* Birthdays */}
                  {filters.showBirthdays &&
                    dayData?.virtualEvents
                      ?.filter((v) => v.type === 2)
                      .map((b) => (
                        <Box
                          key={b.id}
                          className={styles.eventChip}
                          style={{ backgroundColor: '#EC489922', borderLeftColor: '#EC4899', color: '#EC4899' }}
                          onClick={() => onSelectVirtualEvent(b)}
                        >
                          <Cake sx={{ fontSize: 11 }} />
                          <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.68rem', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {b.title}
                          </Typography>
                        </Box>
                      ))}

                  {/* Notes */}
                  {filters.showNotes &&
                    dayData?.notes?.map((n) => (
                      <Box
                        key={n.id}
                        className={styles.eventChip}
                        style={{
                          backgroundColor: `${n.colorCode}22`,
                          borderLeftColor: n.colorCode,
                          color: n.colorCode,
                        }}
                        onClick={() => onSelectNote(n)}
                      >
                        {n.visibilityLevel === 2 ? <Lock sx={{ fontSize: 11 }} /> : <StickyNote2 sx={{ fontSize: 11 }} />}
                        <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.68rem', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {n.content}
                        </Typography>
                      </Box>
                    ))}
                </Box>
              );
            })}
          </Box>

          {/* Scroll Gutter Spacer */}
          <Box className={styles.scrollGutterSpacer} />
        </Box>
      </Box>

      {/* Main 24-Hour Time Grid Scrollable */}
      <Box ref={scrollContainerRef} className={styles.timeGridScroll}>
        <Box className={styles.timeGridMain}>
          {/* Time Gutter */}
          <Box className={styles.timeGutter}>
            {hours.map((hour) => (
              <Box key={hour} className={styles.timeGutterSlot}>
                {hour === 0 ? '' : `${hour < 10 ? '0' : ''}${hour}:00`}
              </Box>
            ))}
          </Box>

          {/* 7 Day Columns */}
          <Box className={styles.dayColumnsContainer} sx={{ gridTemplateColumns: 'repeat(7, minmax(0, 1fr))' }}>
            {dates.map((d, dayIdx) => {
              const iso = formatDateToIso(d);
              const isToday = iso === todayIso;
              const dayData = dataMap.get(iso);
              const dayEvents = filters.showPhysicalEvents ? dayData?.physicalEvents || [] : [];

              return (
                <Box key={dayIdx} className={styles.dayColumn}>
                  {/* Current Time Indicator line */}
                  {isToday && (
                    <Box
                      className={styles.currentTimeLine}
                      style={{ top: `${(currentMinutesFromMidnight / 60) * SLOT_HEIGHT}px` }}
                    />
                  )}

                  {/* 24 Hour click slots */}
                  {hours.map((hour) => (
                    <Box
                      key={hour}
                      className={styles.hourSlot}
                      onClick={() => onTimeSlotClick(iso, hour)}
                    />
                  ))}

                  {/* Absolute positioned physical events */}
                  {dayEvents.map((evt) => {
                    const isConf = evt.visibilityLevel === 2;
                    const start = new Date(evt.startTime);
                    const end = new Date(evt.endTime);

                    const startMin = start.getHours() * 60 + start.getMinutes();
                    let endMin = end.getHours() * 60 + end.getMinutes();
                    if (endMin <= startMin) endMin = startMin + 45; // minimum 45 min duration

                    const top = (startMin / 60) * SLOT_HEIGHT;
                    const height = Math.max(20, ((endMin - startMin) / 60) * SLOT_HEIGHT);

                    return (
                      <Box
                        key={evt.id}
                        sx={{
                          position: 'absolute',
                          top: `${top}px`,
                          height: `${height}px`,
                          left: 3,
                          right: 3,
                          bgcolor: isConf ? '#7C3AED' : 'primary.main',
                          color: '#fff',
                          borderRadius: 1,
                          p: '2px 4px',
                          overflow: 'hidden',
                          cursor: 'pointer',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.18)',
                          zIndex: 5,
                          transition: 'transform 0.15s ease',
                          '&:hover': {
                            transform: 'scale(1.02)',
                            zIndex: 8,
                          },
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectEvent(evt);
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          {isConf && <Lock sx={{ fontSize: 11 }} />}
                          <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, lineHeight: 1.1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {evt.title}
                          </Typography>
                        </Box>
                        <Typography sx={{ fontSize: '0.62rem', opacity: 0.85, lineHeight: 1 }}>
                          {formatTimeDisplay(evt.startTime)} – {formatTimeDisplay(evt.endTime)}
                        </Typography>
                      </Box>
                    );
                  })}
                </Box>
              );
            })}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};
