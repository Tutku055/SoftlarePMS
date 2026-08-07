import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  Card,
  Chip,
} from '@mui/material';
import {
  Search,
  Lock,
  Event as EventIcon,
  Celebration,
  Cake,
  StickyNote2,
  Schedule,
} from '@mui/icons-material';
import type {
  CalendarDayDto,
  CalendarFilters,
  CalendarEventDto,
  CalendarNoteDto,
  VirtualCalendarEventDto,
} from '../../types/calendar.types';
import { parseDateOnly, formatTimeDisplay } from '../../utils/calendarDateUtils';
import styles from '../Calendar.module.css';

interface AgendaViewProps {
  calendarData: CalendarDayDto[];
  filters: CalendarFilters;
  onSelectEvent: (event: CalendarEventDto) => void;
  onSelectNote: (note: CalendarNoteDto) => void;
  onSelectVirtualEvent: (vEvent: VirtualCalendarEventDto) => void;
}

export const AgendaView: React.FC<AgendaViewProps> = ({
  calendarData,
  filters,
  onSelectEvent,
  onSelectNote,
  onSelectVirtualEvent,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Group items by date
  const groupedDays = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();

    return calendarData
      .map((day) => {
        const items: Array<{
          id: string;
          type: 'event' | 'note' | 'holiday' | 'birthday';
          title: string;
          subtitle?: string;
          time?: string;
          color: string;
          rawItem: any;
          isConfidential?: boolean;
        }> = [];

        // Holidays
        if (filters.showHolidays) {
          day.virtualEvents
            ?.filter((v) => v.type === 1)
            .forEach((h) => {
              if (!term || h.title.toLowerCase().includes(term) || h.description?.toLowerCase().includes(term)) {
                items.push({
                  id: h.id,
                  type: 'holiday',
                  title: h.title,
                  subtitle: h.description || undefined,
                  color: h.colorCode || '#10B981',
                  rawItem: h,
                });
              }
            });
        }

        // Birthdays
        if (filters.showBirthdays) {
          day.virtualEvents
            ?.filter((v) => v.type === 2)
            .forEach((b) => {
              if (!term || b.title.toLowerCase().includes(term) || b.description?.toLowerCase().includes(term)) {
                items.push({
                  id: b.id,
                  type: 'birthday',
                  title: b.title,
                  subtitle: b.description || undefined,
                  color: b.colorCode || '#EC4899',
                  rawItem: b,
                });
              }
            });
        }

        // Physical Events
        if (filters.showPhysicalEvents) {
          day.physicalEvents?.forEach((e) => {
            if (!term || e.title.toLowerCase().includes(term) || e.description?.toLowerCase().includes(term) || e.departmentName?.toLowerCase().includes(term)) {
              const isConf = e.visibilityLevel === 2;
              let subtitle = e.description || undefined;
              if (e.departmentName) {
                subtitle = subtitle ? `[${e.departmentName}] ${subtitle}` : `Department: ${e.departmentName}`;
              }
              items.push({
                id: e.id,
                type: 'event',
                title: e.title,
                subtitle,
                time: `${formatTimeDisplay(e.startTime)} – ${formatTimeDisplay(e.endTime)}`,
                color: isConf ? '#8B5CF6' : '#3B82F6',
                rawItem: e,
                isConfidential: isConf,
              });
            }
          });
        }

        // Notes
        if (filters.showNotes) {
          day.notes?.forEach((n) => {
            if (!term || n.content.toLowerCase().includes(term) || n.authorName?.toLowerCase().includes(term)) {
              items.push({
                id: n.id,
                type: 'note',
                title: n.content,
                subtitle: n.authorName ? `Author: ${n.authorName}` : undefined,
                color: n.colorCode || '#F59E0B',
                rawItem: n,
                isConfidential: n.visibilityLevel === 2,
              });
            }
          });
        }

        return {
          date: day.date,
          dayOfWeek: day.dayOfWeek,
          isToday: day.isToday,
          items,
        };
      })
      .filter((d) => d.items.length > 0);
  }, [calendarData, filters, searchTerm]);

  return (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Search Header */}
      <Box className={styles.agendaHeader} sx={{ p: 2, borderBottom: '1px solid rgba(140, 140, 160, 0.15)', bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'rgba(140, 140, 160, 0.02)' }}>
        <TextField
          size="small"
          placeholder="Search events, notes, holidays..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          fullWidth
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Search fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
          sx={{ minWidth: 280, maxWidth: 400 }}
        />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {groupedDays.reduce((acc, curr) => acc + curr.items.length, 0)} items found
        </Typography>
      </Box>

      {/* List Container */}
      <Box className={styles.agendaContainer}>
        {groupedDays.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
            <Schedule sx={{ fontSize: 48, opacity: 0.4, mb: 1 }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              No upcoming items found
            </Typography>
            <Typography variant="body2">
              Try adjusting your date range or filters.
            </Typography>
          </Box>
        ) : (
          groupedDays.map((group) => {
            const dateObj = parseDateOnly(group.date);
            const monthShort = dateObj.toLocaleDateString('en-US', { month: 'short' });

            return (
              <Box key={group.date} className={styles.agendaDateGroup}>
                {/* Date Badge */}
                <Box
                  className={styles.agendaDateBadge}
                  sx={{
                    border: (theme) =>
                      group.isToday
                        ? `2px solid ${theme.palette.primary.main}`
                        : `1px solid ${theme.palette.divider}`,
                    bgcolor: (theme) =>
                      group.isToday
                        ? theme.palette.mode === 'dark'
                          ? 'rgba(99, 102, 241, 0.15)'
                          : 'rgba(79, 70, 229, 0.08)'
                        : theme.palette.mode === 'dark'
                        ? 'rgba(255, 255, 255, 0.03)'
                        : 'rgba(140, 140, 160, 0.04)',
                  }}
                >
                  <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', color: group.isToday ? 'primary.main' : 'text.secondary' }}>
                    {monthShort}
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: group.isToday ? 'primary.main' : 'text.primary' }}>
                    {dateObj.getDate()}
                  </Typography>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                    {group.dayOfWeek.slice(0, 3)}
                  </Typography>
                </Box>

                {/* Items in this date */}
                <Box className={styles.agendaItemsList}>
                  {group.items.map((item) => (
                    <Card
                      key={item.id}
                      className={styles.agendaItemCard}
                      sx={{
                        borderLeft: `4px solid ${item.color}`,
                        '&:hover': { bgcolor: `${item.color}15` },
                      }}
                      onClick={() => {
                        if (item.type === 'event') onSelectEvent(item.rawItem);
                        else if (item.type === 'note') onSelectNote(item.rawItem);
                        else onSelectVirtualEvent(item.rawItem);
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1 }}>
                        <Box sx={{ color: item.color, display: 'flex' }}>
                          {item.type === 'holiday' && <Celebration fontSize="small" />}
                          {item.type === 'birthday' && <Cake fontSize="small" />}
                          {item.type === 'event' && (
                            item.isConfidential ? <Lock fontSize="small" /> : <EventIcon fontSize="small" />
                          )}
                          {item.type === 'note' && (
                            item.isConfidential ? <Lock fontSize="small" /> : <StickyNote2 fontSize="small" />
                          )}
                        </Box>
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                            {item.title}
                          </Typography>
                          {item.subtitle && (
                            <Typography variant="caption" color="text.secondary">
                              {item.subtitle}
                            </Typography>
                          )}
                        </Box>
                      </Box>

                      {item.time && (
                        <Chip
                          label={item.time}
                          size="small"
                          sx={{
                            fontWeight: 600,
                            fontSize: '0.75rem',
                            bgcolor: 'rgba(59, 130, 246, 0.15)',
                            color: '#3B82F6',
                          }}
                        />
                      )}
                    </Card>
                  ))}
                </Box>
              </Box>
            );
          })
        )}
      </Box>
    </Box>
  );
};
