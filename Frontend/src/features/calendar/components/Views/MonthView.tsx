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
import { CalendarEventType } from '../../types/calendar.types';
import { formatTimeDisplay, formatDateToIso } from '../../utils/calendarDateUtils';
import styles from '../Calendar.module.css';

type CalendarItem = {
  key: string;
  type: 'event' | 'note' | 'holiday' | 'birthday';
  title: string;
  time?: string;
  color: string;
  rawItem: any;
  isConfidential?: boolean;
  eventType?: CalendarEventType;
};

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
        {(() => {
          // Pre-collect all items per day
          const dailyItemsMap = new Map<string, CalendarItem[]>();
          
          dates.forEach(date => {
            const isoDate = formatDateToIso(date);
            const dayData = dataMap.get(isoDate);
            const items: CalendarItem[] = [];

            if (dayData) {
              // Holidays
              if (filters.showHolidays) {
                dayData.virtualEvents?.filter((v) => v.type === 1).forEach((h) => {
                  items.push({ key: h.id, type: 'holiday', title: h.title, color: h.colorCode || '#10B981', rawItem: h, eventType: CalendarEventType.AllDay });
                });
              }

              // Birthdays
              if (filters.showBirthdays) {
                dayData.virtualEvents?.filter((v) => v.type === 2).forEach((b) => {
                  items.push({ key: b.id, type: 'birthday', title: b.title, color: b.colorCode || '#EC4899', rawItem: b, eventType: CalendarEventType.AllDay });
                });
              }

              // Physical Events
              if (filters.showPhysicalEvents) {
                dayData.physicalEvents?.forEach((e) => {
                  const isConf = e.visibilityLevel === 2;
                  let deducedType = e.eventType;
                  if (!deducedType) {
                    deducedType = e.startTime.split('T')[0] !== e.endTime.split('T')[0] ? CalendarEventType.MultiDay : CalendarEventType.TimeBased;
                  }
                  items.push({ key: e.id, type: 'event', title: e.title, time: deducedType === CalendarEventType.TimeBased ? formatTimeDisplay(e.startTime) : undefined, color: isConf ? '#8B5CF6' : '#3B82F6', rawItem: e, isConfidential: isConf, eventType: deducedType });
                });
              }

              // Notes
              if (filters.showNotes) {
                dayData.notes?.forEach((n) => {
                  items.push({ key: n.id, type: 'note', title: n.content, color: n.colorCode || '#F59E0B', rawItem: n, isConfidential: n.visibilityLevel === 2 });
                });
              }
            }

            dailyItemsMap.set(isoDate, items);
          });

          const layoutedDays = new Map<string, { visible: (CalendarItem | null)[], hidden: CalendarItem[] }>();

          for (let weekStart = 0; weekStart < dates.length; weekStart += 7) {
            const weekDates = dates.slice(weekStart, weekStart + 7);
            const weekIsos = weekDates.map(d => formatDateToIso(d));
            
            const solidItemsThisWeek = new Map<string, CalendarItem>();
            const itemSpan = new Map<string, { start: number, end: number }>();
            
            weekIsos.forEach((iso, dayIdx) => {
              const items = dailyItemsMap.get(iso) || [];
              items.forEach(item => {
                const isSolid = item.eventType === CalendarEventType.MultiDay || item.eventType === CalendarEventType.AllDay || item.type === 'holiday' || item.type === 'birthday' || item.type === 'note';
                if (isSolid) {
                  if (!solidItemsThisWeek.has(item.key)) {
                     solidItemsThisWeek.set(item.key, item);
                     itemSpan.set(item.key, { start: dayIdx, end: dayIdx });
                  } else {
                     itemSpan.get(item.key)!.end = dayIdx;
                  }
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
              
              return (a.time || '').localeCompare(b.time || '');
            });

            const lanes: (CalendarItem | null)[][] = Array(10).fill(null).map(() => Array(7).fill(null));
            
            sortedSolid.forEach(item => {
              const span = itemSpan.get(item.key)!;
              for (let l = 0; l < 10; l++) {
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

            weekIsos.forEach((iso, dayIdx) => {
              const itemsOnDay = dailyItemsMap.get(iso) || [];
              const timeBasedItems = itemsOnDay.filter(i => {
                const isSolid = i.eventType === CalendarEventType.MultiDay || i.eventType === CalendarEventType.AllDay || i.type === 'holiday' || i.type === 'birthday' || i.type === 'note';
                return !isSolid;
              });
              
              timeBasedItems.sort((a, b) => (a.time || '').localeCompare(b.time || ''));
              
              const visibleSlots: (CalendarItem | null)[] = [null, null, null];
              const hiddenItems: CalendarItem[] = [];
              
              for (let l = 0; l < 10; l++) {
                const item = lanes[l][dayIdx];
                if (item) {
                  if (l < 3) {
                    visibleSlots[l] = item;
                  } else {
                    hiddenItems.push(item);
                  }
                }
              }
              
              timeBasedItems.forEach(item => {
                const emptyIdx = visibleSlots.findIndex(s => s === null);
                if (emptyIdx !== -1) {
                  visibleSlots[emptyIdx] = item;
                } else {
                  hiddenItems.push(item);
                }
              });
              
              while (visibleSlots.length > 0 && visibleSlots[visibleSlots.length - 1] === null) {
                visibleSlots.pop();
              }
              
              layoutedDays.set(iso, { visible: visibleSlots, hidden: hiddenItems });
            });
          }

          return dates.map((date, idx) => {
            const isoDate = formatDateToIso(date);
            const dayData = dataMap.get(isoDate);
            const isOtherMonth = date.getMonth() !== currentMonth;
            const isWeekend = date.getDay() === 0 || date.getDay() === 6;
            const isToday = dayData?.isToday ?? false;

            const { visible: visibleItems, hidden: hiddenItems } = layoutedDays.get(isoDate) || { visible: [], hidden: [] };

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
                {visibleItems.map((item, i) => {
                  if (item === null) {
                    return <Box key={`spacer-${i}`} className={styles.eventChip} sx={{ visibility: 'hidden' }} />;
                  }

                  const isAllDay = item.eventType === CalendarEventType.AllDay || item.type === 'holiday' || item.type === 'birthday' || item.type === 'note';
                  const isMultiDay = item.eventType === CalendarEventType.MultiDay || (item.type === 'event' && item.rawItem.startTime.split('T')[0] !== item.rawItem.endTime.split('T')[0]);
                  const isSolid = isAllDay || isMultiDay;
                  
                  let borderRadius = '4px';
                  let marginLeft = '0';
                  let marginRight = '0';
                  let paddingLeft = '4px';
                  
                  if (isMultiDay && item.type === 'event') {
                    const eStart = item.rawItem.startTime.split('T')[0];
                    const eEnd = item.rawItem.endTime.split('T')[0];
                    const isStart = eStart === isoDate;
                    const isEnd = eEnd === isoDate;
                    
                    const isMonday = date.getDay() === 1;
                    const isSunday = date.getDay() === 0;

                    let rTL = '4px';
                    let rTR = '4px';
                    let rBR = '4px';
                    let rBL = '4px';
                    
                    if (!isStart) {
                      rTL = '0';
                      rBL = '0';
                      marginLeft = isMonday ? '-6px' : '-7px';
                      paddingLeft = '8px';
                    }
                    if (!isEnd) {
                      rTR = '0';
                      rBR = '0';
                      marginRight = isSunday ? '-6px' : '-7px';
                    }
                    
                    borderRadius = `${rTL} ${rTR} ${rBR} ${rBL}`;
                  } else if (isAllDay) {
                     borderRadius = '4px';
                  }

                  const isMonday = date.getDay() === 1;
                  const showIconAndText = !isMultiDay || item.rawItem.startTime.split('T')[0] === isoDate || isMonday;

                  return (
                  <Box
                    key={`${item.key}-${i}`}
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
                    onClick={(e) => {
                      e.stopPropagation();
                      if (item.type === 'event') onSelectEvent(item.rawItem);
                      else if (item.type === 'note') onSelectNote(item.rawItem);
                      else onSelectVirtualEvent(item.rawItem);
                    }}
                  >
                    {showIconAndText && (
                      <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', overflow: 'hidden' }}>
                        {item.type === 'holiday' && <Celebration sx={{ fontSize: 12, flexShrink: 0, mr: 0.3 }} />}
                        {item.type === 'birthday' && <Cake sx={{ fontSize: 12, flexShrink: 0, mr: 0.3 }} />}
                        {item.type === 'event' && (
                          item.isConfidential ? <Lock sx={{ fontSize: 12, flexShrink: 0, mr: 0.3 }} /> : <EventIcon sx={{ fontSize: 12, flexShrink: 0, mr: 0.3 }} />
                        )}
                        {item.type === 'note' && (
                          item.isConfidential ? <Lock sx={{ fontSize: 12, flexShrink: 0, mr: 0.3 }} /> : <StickyNote2 sx={{ fontSize: 12, flexShrink: 0, mr: 0.3 }} />
                        )}
                        {item.time && (
                          <Typography component="span" sx={{ fontSize: '0.7rem', fontWeight: 700, mr: 0.3, flexShrink: 0 }}>
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
                    )}
                  </Box>
                )})}

                {(() => {
                  const normalOverflows = hiddenItems.filter(i => (!i.isConfidential && i.type !== 'note') || i.type === 'holiday' || i.type === 'birthday');
                  const confidentialOverflows = hiddenItems.filter(i => i.isConfidential && i.type === 'event');
                  const noteOverflows = hiddenItems.filter(i => i.type === 'note');
                  return dayData && hiddenItems.length > 0 ? (
                  <Box sx={{ mt: 'auto', display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {normalOverflows.length > 0 && (
                        <Box
                          className={styles.moreBadge}
                          onClick={(e) => handleOpenMore(e, dayData)}
                          sx={{ fontSize: '0.65rem', py: 0.25, px: 0.5, bgcolor: 'rgba(140,140,160,0.1)', borderRadius: 1, color: 'text.secondary', cursor: 'pointer', '&:hover': { bgcolor: 'rgba(140,140,160,0.2)' } }}
                        >
                          +{normalOverflows.length} more
                        </Box>
                      )}
                      {confidentialOverflows.length > 0 && (
                        <Box
                          className={styles.moreBadge}
                          onClick={(e) => handleOpenMore(e, dayData)}
                          sx={{ fontSize: '0.65rem', py: 0.25, px: 0.5, bgcolor: 'rgba(124, 58, 237, 0.1)', borderRadius: 1, color: '#7C3AED', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 0.3, '&:hover': { bgcolor: 'rgba(124, 58, 237, 0.2)' } }}
                        >
                          <Lock sx={{ fontSize: 10 }} /> +{confidentialOverflows.length} more
                        </Box>
                      )}
                      {noteOverflows.length > 0 && (
                        <Box
                          className={styles.moreBadge}
                          onClick={(e) => handleOpenMore(e, dayData)}
                          sx={{ fontSize: '0.65rem', py: 0.25, px: 0.5, bgcolor: 'rgba(245, 158, 11, 0.1)', borderRadius: 1, color: '#D97706', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 0.3, '&:hover': { bgcolor: 'rgba(245, 158, 11, 0.2)' } }}
                        >
                          <StickyNote2 sx={{ fontSize: 10 }} /> +{noteOverflows.length} notes
                        </Box>
                      )}
                    </Box>
                  ) : null;
                })()}
              </Box>
            </Box>
          );
        });
        })()}
      </Box>

      {/* "More Items" Popover */}
      <Popover
        open={Boolean(popoverAnchor)}
        anchorEl={popoverAnchor}
        onClose={handleClosePopover}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        slotProps={{
          paper: {
            sx: {
              p: 1.5,
              width: 280,
              borderRadius: 2,
              maxHeight: 350,
              overflowY: 'auto',
              zIndex: 1300,
              boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
            },
          },
        }}
        sx={{ zIndex: 1300 }}
      >
        {popoverDay && (
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, px: 1, borderBottom: '1px solid', borderColor: 'divider', pb: 1 }}>
              {new Date(popoverDay.date + 'T00:00:00').toLocaleDateString(undefined, {
                weekday: 'long',
                month: 'short',
                day: 'numeric',
              })}
            </Typography>
            <List dense disablePadding sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              
              {/* Company Events */}
              {filters.showPhysicalEvents && popoverDay.physicalEvents?.filter(e => e.visibilityLevel !== 2).length ? (
                <>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', mt: 1, px: 1 }}>
                    Company Events
                  </Typography>
                  {popoverDay.physicalEvents.filter(e => e.visibilityLevel !== 2).map((e) => (
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
                            <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#3B82F6', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {e.eventType === CalendarEventType.TimeBased ? `${formatTimeDisplay(e.startTime)} ` : ''}{e.title}
                            </Typography>
                          }
                        />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </>
              ) : null}

              {/* Confidential Events */}
              {filters.showPhysicalEvents && popoverDay.physicalEvents?.filter(e => e.visibilityLevel === 2).length ? (
                <>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#7C3AED', textTransform: 'uppercase', mt: 1, px: 1 }}>
                    Confidential Events
                  </Typography>
                  {popoverDay.physicalEvents.filter(e => e.visibilityLevel === 2).map((e) => (
                    <ListItem key={e.id} disablePadding>
                      <ListItemButton
                        onClick={() => {
                          handleClosePopover();
                          onSelectEvent(e);
                        }}
                        sx={{ borderRadius: 1, py: 0.5, bgcolor: '#8B5CF622' }}
                      >
                        <ListItemIcon sx={{ minWidth: 28, color: '#8B5CF6' }}>
                          <Lock fontSize="small" />
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#8B5CF6', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {e.eventType === CalendarEventType.TimeBased ? `${formatTimeDisplay(e.startTime)} ` : ''}{e.title}
                            </Typography>
                          }
                        />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </>
              ) : null}

              {/* Notes */}
              {filters.showNotes && popoverDay.notes?.length ? (
                <>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#D97706', textTransform: 'uppercase', mt: 1, px: 1 }}>
                    Notes
                  </Typography>
                  {popoverDay.notes.map((n) => (
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
                            <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: n.colorCode, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {n.content}
                            </Typography>
                          }
                        />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </>
              ) : null}

              {/* Birthdays & Holidays */}
              {((filters.showHolidays && popoverDay.virtualEvents?.some(v => v.type === 1)) || (filters.showBirthdays && popoverDay.virtualEvents?.some(v => v.type === 2))) ? (
                <>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', mt: 1, px: 1 }}>
                    Birthdays & Holidays
                  </Typography>
                  {filters.showHolidays &&
                    popoverDay.virtualEvents
                      ?.filter((v) => v.type === 1)
                      .map((v) => (
                        <ListItem key={v.id} disablePadding>
                          <ListItemButton
                            onClick={() => {
                              handleClosePopover();
                              onSelectVirtualEvent(v);
                            }}
                            sx={{ borderRadius: 1, py: 0.5, bgcolor: '#10B98122' }}
                          >
                            <ListItemIcon sx={{ minWidth: 28, color: '#10B981' }}>
                              <Celebration fontSize="small" />
                            </ListItemIcon>
                            <ListItemText
                              primary={
                                <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#10B981', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {v.title}
                                </Typography>
                              }
                            />
                          </ListItemButton>
                        </ListItem>
                      ))}

                  {filters.showBirthdays &&
                    popoverDay.virtualEvents
                      ?.filter((v) => v.type === 2)
                      .map((v) => (
                        <ListItem key={v.id} disablePadding>
                          <ListItemButton
                            onClick={() => {
                              handleClosePopover();
                              onSelectVirtualEvent(v);
                            }}
                            sx={{ borderRadius: 1, py: 0.5, bgcolor: '#EC489922' }}
                          >
                            <ListItemIcon sx={{ minWidth: 28, color: '#EC4899' }}>
                              <Cake fontSize="small" />
                            </ListItemIcon>
                            <ListItemText
                              primary={
                                <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#EC4899', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {v.title}
                                </Typography>
                              }
                            />
                          </ListItemButton>
                        </ListItem>
                      ))}
                </>
              ) : null}

            </List>
          </Box>
        )}
      </Popover>
    </Box>
  );
};
