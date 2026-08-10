import React, { useEffect, useRef } from 'react';
import { Box, Typography } from '@mui/material';
import {
  Lock,
  Celebration,
  Cake,
  StickyNote2,
  Event as EventIcon,
} from '@mui/icons-material';
import type {
  CalendarDayDto,
  CalendarFilters,
  CalendarEventDto,
  CalendarNoteDto,
  VirtualCalendarEventDto,
} from '../../types/calendar.types';
import { CalendarEventType } from '../../types/calendar.types';
import { formatDateToIso, formatTimeDisplay } from '../../utils/calendarDateUtils';
import { layoutDayEvents } from '../../utils/eventLayoutUtils';
import { EventStack } from './EventStack';
import styles from '../Calendar.module.css';

type CalendarItem = {
  key: string;
  type: 'event' | 'note' | 'holiday' | 'birthday';
  title: string;
  color: string;
  rawItem: any;
  isConfidential?: boolean;
  eventType?: CalendarEventType;
};

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

  // Layout all-day items for WeekView
  const weekIsos = dates.map(d => formatDateToIso(d));
  const dailyItemsMap = new Map<string, CalendarItem[]>();
  
  dates.forEach(date => {
    const iso = formatDateToIso(date);
    const dayData = dataMap.get(iso);
    const items: CalendarItem[] = [];

    if (dayData) {
      if (filters.showHolidays) {
        dayData.virtualEvents?.filter(v => v.type === 1).forEach(h => {
          items.push({ key: h.id, type: 'holiday', title: h.title, color: h.colorCode || '#10B981', rawItem: h, eventType: CalendarEventType.AllDay });
        });
      }
      if (filters.showBirthdays) {
        dayData.virtualEvents?.filter(v => v.type === 2).forEach(b => {
          items.push({ key: b.id, type: 'birthday', title: b.title, color: b.colorCode || '#EC4899', rawItem: b, eventType: CalendarEventType.AllDay });
        });
      }
      if (filters.showNotes) {
        dayData.notes?.forEach(n => {
          items.push({ key: n.id, type: 'note', title: n.content, color: n.colorCode || '#F59E0B', rawItem: n, isConfidential: n.visibilityLevel === 2 });
        });
      }
      if (filters.showPhysicalEvents) {
        dayData.physicalEvents?.forEach(e => {
          const isExplicitSolid = e.eventType === CalendarEventType.AllDay || e.eventType === CalendarEventType.MultiDay;
          const isLegacyMultiDay = !e.eventType && e.startTime.split('T')[0] !== e.endTime.split('T')[0];
          if (isExplicitSolid || isLegacyMultiDay) {
            const isConf = e.visibilityLevel === 2;
            items.push({ key: e.id, type: 'event', title: e.title, color: isConf ? '#8B5CF6' : '#3B82F6', rawItem: e, isConfidential: isConf, eventType: e.eventType || CalendarEventType.MultiDay });
          }
        });
      }
    }
    dailyItemsMap.set(iso, items);
  });

  const solidItemsThisWeek = new Map<string, CalendarItem>();
  const itemSpan = new Map<string, { start: number, end: number }>();
  
  weekIsos.forEach((iso, dayIdx) => {
    const items = dailyItemsMap.get(iso) || [];
    items.forEach(item => {
      if (!solidItemsThisWeek.has(item.key)) {
        solidItemsThisWeek.set(item.key, item);
        itemSpan.set(item.key, { start: dayIdx, end: dayIdx });
      } else {
        itemSpan.get(item.key)!.end = dayIdx;
      }
    });
  });

  const sortedSolid = Array.from(solidItemsThisWeek.values()).sort((a, b) => {
    const spanA = itemSpan.get(a.key)!;
    const spanB = itemSpan.get(b.key)!;
    const lenA = spanA.end - spanA.start;
    const lenB = spanB.end - spanB.start;
    if (lenA !== lenB) return lenB - lenA;
    
    const priorityA = a.eventType === CalendarEventType.MultiDay ? 3 : a.eventType === CalendarEventType.AllDay ? 2 : 1;
    const priorityB = b.eventType === CalendarEventType.MultiDay ? 3 : b.eventType === CalendarEventType.AllDay ? 2 : 1;
    if (priorityA !== priorityB) return priorityB - priorityA;
    
    return a.title.localeCompare(b.title);
  });

  const maxLanes = 20;
  const lanes: (CalendarItem | null)[][] = Array(maxLanes).fill(null).map(() => Array(7).fill(null));
  
  sortedSolid.forEach(item => {
    const span = itemSpan.get(item.key)!;
    for (let l = 0; l < maxLanes; l++) {
      let canFit = true;
      for (let d = span.start; d <= span.end; d++) {
        if (lanes[l][d] !== null) { canFit = false; break; }
      }
      if (canFit) {
        for (let d = span.start; d <= span.end; d++) {
          const itemsOnDay = dailyItemsMap.get(weekIsos[d]) || [];
          if (itemsOnDay.some(i => i.key === item.key)) {
            lanes[l][d] = item;
          }
        }
        break;
      }
    }
  });

  let activeLanesCount = 0;
  for (let l = 0; l < maxLanes; l++) {
    if (lanes[l].some(item => item !== null)) {
      activeLanesCount = l + 1;
    }
  }

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
                    overflow: 'visible',
                  }}
                >
                  {Array.from({ length: activeLanesCount }).map((_, laneIdx) => {
                    const item = lanes[laneIdx][idx];
                    if (!item) {
                      return <Box key={`spacer-${laneIdx}`} className={styles.eventChip} sx={{ visibility: 'hidden' }} />;
                    }
                    
                    const isMultiDay = item.eventType === CalendarEventType.MultiDay || (item.type === 'event' && item.rawItem.startTime.split('T')[0] !== item.rawItem.endTime.split('T')[0]);
                    const isSolid = isMultiDay || item.eventType === CalendarEventType.AllDay;
                    
                    let borderRadius = '4px';
                    let marginLeft = '0';
                    let marginRight = '0';
                    let paddingLeft = '4px';
                    
                    if (isMultiDay && item.type === 'event') {
                      const eStart = item.rawItem.startTime.split('T')[0];
                      const eEnd = item.rawItem.endTime.split('T')[0];
                      const isStart = eStart === iso;
                      const isEnd = eEnd === iso;
                      
                      const isMonday = d.getDay() === 1;
                      const isSunday = d.getDay() === 0;

                      let rTL = '4px';
                      let rTR = '4px';
                      let rBR = '4px';
                      let rBL = '4px';
                      
                      if (!isStart) {
                        rTL = '0';
                        rBL = '0';
                        marginLeft = isMonday ? '-4px' : '-5px';
                        paddingLeft = '8px';
                      }
                      if (!isEnd) {
                        rTR = '0';
                        rBR = '0';
                        marginRight = isSunday ? '-4px' : '-5px';
                      }
                      
                      borderRadius = `${rTL} ${rTR} ${rBR} ${rBL}`;
                    } else if (isSolid) {
                       borderRadius = '4px';
                    }

                    const isMonday = d.getDay() === 1;
                    const showIconAndText = !isMultiDay || (item.type === 'event' && item.rawItem.startTime.split('T')[0] === iso) || isMonday;

                    return (
                      <Box
                        key={item.key}
                        className={styles.eventChip}
                        style={{
                          backgroundColor: isSolid ? item.color : `${item.color}22`,
                          borderLeft: isSolid ? 'none' : `3px solid ${item.color}`,
                          color: isSolid ? '#fff' : item.color,
                          borderRadius,
                          marginLeft,
                          marginRight,
                          paddingLeft,
                          position: 'relative',
                          zIndex: isMultiDay ? 2 : 1
                        }}
                        onClick={() => {
                          if (item.type === 'event') onSelectEvent(item.rawItem);
                          else if (item.type === 'note') onSelectNote(item.rawItem);
                          else onSelectVirtualEvent(item.rawItem);
                        }}
                      >
                        {showIconAndText && (
                          <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', overflow: 'hidden' }}>
                            {item.type === 'holiday' && <Celebration sx={{ fontSize: 11, flexShrink: 0, mr: 0.3 }} />}
                            {item.type === 'birthday' && <Cake sx={{ fontSize: 11, flexShrink: 0, mr: 0.3 }} />}
                            {item.type === 'note' && (item.isConfidential ? <Lock sx={{ fontSize: 11, flexShrink: 0, mr: 0.3 }} /> : <StickyNote2 sx={{ fontSize: 11, flexShrink: 0, mr: 0.3 }} />)}
                            {item.type === 'event' && (item.isConfidential ? <Lock sx={{ fontSize: 11, flexShrink: 0, mr: 0.3 }} /> : <EventIcon sx={{ fontSize: 11, flexShrink: 0, mr: 0.3 }} />)}
                            <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.68rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {item.title}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    );
                  })}
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
              const dayEvents = filters.showPhysicalEvents 
                ? (dayData?.physicalEvents || []).filter(e => {
                    const isExplicitSolid = e.eventType === CalendarEventType.AllDay || e.eventType === CalendarEventType.MultiDay;
                    const isLegacyMultiDay = !e.eventType && e.startTime.split('T')[0] !== e.endTime.split('T')[0];
                    return !isExplicitSolid && !isLegacyMultiDay;
                  })
                : [];

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
                  {layoutDayEvents(dayEvents, 3).map((group) => {
                    if (group.events.length > 1) {
                      return (
                        <EventStack
                          key={group.id}
                          events={group.events}
                          onSelectEvent={onSelectEvent}
                          slotHeight={SLOT_HEIGHT}
                          isWeekView
                        />
                      );
                    }
                    
                    const evt = group.events[0];
                    const isConf = evt.visibilityLevel === 2;
                    const top = (evt.startMin / 60) * SLOT_HEIGHT;
                    const height = Math.max(20, ((evt.endMin - evt.startMin) / 60) * SLOT_HEIGHT);
                    
                    const laneWidth = 100 / evt.laneCount;
                    const laneInset = evt.laneCount > 1 ? 2 : 3;
                    const left = evt.laneCount > 1 ? `calc(${evt.lane * laneWidth}% + ${laneInset}px)` : 3;
                    const right = evt.laneCount > 1 ? `calc(${(evt.laneCount - evt.lane - 1) * laneWidth}% + ${laneInset}px)` : 3;

                    return (
                      <Box
                        key={evt.id}
                        sx={{
                          position: 'absolute',
                          top: `${top}px`,
                          height: `${height}px`,
                          left,
                          right,
                          bgcolor: isConf ? '#7C3AED' : 'primary.main',
                          color: '#fff',
                          borderRadius: 1,
                          p: '2px 4px',
                          overflow: 'hidden',
                          cursor: 'pointer',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.18)',
                          zIndex: 5 + evt.lane,
                          transition: 'transform 0.15s ease',
                          '&:hover': {
                            transform: 'scale(1.02)',
                            zIndex: 20,
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
                        <Typography sx={{ fontSize: '0.62rem', opacity: 0.85, lineHeight: 1, mt: 0.25 }}>
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
