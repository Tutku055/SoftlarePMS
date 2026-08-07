import React, { useState } from 'react';
import {
  Box,
  Typography,
  Checkbox,
  FormControlLabel,
  IconButton,
  Card,
  CardContent,
  Divider,
} from '@mui/material';
import {
  ChevronLeft,
  ChevronRight,
  Event as EventIcon,
  Celebration,
  Cake,
  StickyNote2,
} from '@mui/icons-material';
import type { CalendarFilters, CalendarDayDto } from '../types/calendar.types';
import styles from './Calendar.module.css';

interface CalendarSidebarProps {
  isOpen: boolean;
  selectedDate: Date;
  onSelectDate: (d: Date) => void;
  filters: CalendarFilters;
  onFilterChange: (filters: CalendarFilters) => void;
  calendarData?: CalendarDayDto[];
}

export const CalendarSidebar: React.FC<CalendarSidebarProps> = ({
  isOpen,
  selectedDate,
  onSelectDate,
  filters,
  onFilterChange,
  calendarData = [],
}) => {
  // Mini calendar local month view state
  const [miniMonthDate, setMiniMonthDate] = useState<Date>(new Date(selectedDate));

  const handlePrevMonth = () => {
    setMiniMonthDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setMiniMonthDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const miniYear = miniMonthDate.getFullYear();
  const miniMonth = miniMonthDate.getMonth();
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];

  // Generate mini calendar days
  const firstOfMonth = new Date(miniYear, miniMonth, 1);
  let dayOfWeek = firstOfMonth.getDay() - 1;
  if (dayOfWeek < 0) dayOfWeek = 6; // Monday is 0

  const gridStart = new Date(miniYear, miniMonth, 1 - dayOfWeek);
  const miniDays: Date[] = [];
  for (let i = 0; i < 35; i++) {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    miniDays.push(d);
  }

  const today = new Date();
  const isSameDay = (d1: Date, d2: Date) =>
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();

  // Calculate summary counts
  const totalPhysicalEvents = calendarData.reduce((acc, curr) => acc + (curr.physicalEvents?.length || 0), 0);
  const totalHolidays = calendarData.reduce(
    (acc, curr) => acc + (curr.virtualEvents?.filter((v) => v.type === 1).length || 0),
    0
  );
  const totalBirthdays = calendarData.reduce(
    (acc, curr) => acc + (curr.virtualEvents?.filter((v) => v.type === 2).length || 0),
    0
  );
  const totalNotes = calendarData.reduce((acc, curr) => acc + (curr.notes?.length || 0), 0);

  return (
    <Box className={`${styles.sidebarContainer} ${!isOpen ? styles.sidebarClosed : ''}`}>
      {/* Mini Calendar Widget */}
      <Box className={styles.miniCalendar}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.82rem' }}>
            {monthNames[miniMonth]} {miniYear}
          </Typography>
          <Box sx={{ display: 'flex' }}>
            <IconButton size="small" onClick={handlePrevMonth} sx={{ p: 0.25 }}>
              <ChevronLeft fontSize="small" />
            </IconButton>
            <IconButton size="small" onClick={handleNextMonth} sx={{ p: 0.25 }}>
              <ChevronRight fontSize="small" />
            </IconButton>
          </Box>
        </Box>

        <Box className={styles.miniCalendarGrid}>
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, idx) => (
            <Box key={idx} className={styles.miniDayHeader}>
              {day}
            </Box>
          ))}

          {miniDays.map((date, idx) => {
            const isSelected = isSameDay(date, selectedDate);
            const isCurrToday = isSameDay(date, today);
            const isOtherMonth = date.getMonth() !== miniMonth;

            return (
              <Box
                key={idx}
                className={`${styles.miniDayCell} ${isSelected ? styles.miniSelectedDay : ''} ${
                  isCurrToday && !isSelected ? styles.miniToday : ''
                }`}
                style={{ opacity: isOtherMonth ? 0.35 : 1 }}
                onClick={() => onSelectDate(date)}
              >
                {date.getDate()}
              </Box>
            );
          })}
        </Box>
      </Box>

      <Divider />

      {/* Category / Layer Visibility Filters */}
      <Box>
        <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: 'text.secondary', mb: 0.75, display: 'block', fontSize: '0.65rem' }}>
          Filters
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={filters.showPhysicalEvents}
                onChange={(e) => onFilterChange({ ...filters, showPhysicalEvents: e.target.checked })}
                sx={{
                  p: 0.5,
                  color: '#3B82F6',
                  '&.Mui-checked': { color: '#3B82F6' },
                }}
              />
            }
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <EventIcon sx={{ fontSize: 15, color: '#3B82F6' }} />
                <Typography variant="body2" sx={{ fontSize: '0.78rem', fontWeight: 500 }}>
                  Company Events
                </Typography>
              </Box>
            }
          />

          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={filters.showHolidays}
                onChange={(e) => onFilterChange({ ...filters, showHolidays: e.target.checked })}
                sx={{
                  p: 0.5,
                  color: '#10B981',
                  '&.Mui-checked': { color: '#10B981' },
                }}
              />
            }
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <Celebration sx={{ fontSize: 15, color: '#10B981' }} />
                <Typography variant="body2" sx={{ fontSize: '0.78rem', fontWeight: 500 }}>
                  Public Holidays
                </Typography>
              </Box>
            }
          />

          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={filters.showBirthdays}
                onChange={(e) => onFilterChange({ ...filters, showBirthdays: e.target.checked })}
                sx={{
                  p: 0.5,
                  color: '#EC4899',
                  '&.Mui-checked': { color: '#EC4899' },
                }}
              />
            }
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <Cake sx={{ fontSize: 15, color: '#EC4899' }} />
                <Typography variant="body2" sx={{ fontSize: '0.78rem', fontWeight: 500 }}>
                  Birthdays
                </Typography>
              </Box>
            }
          />

          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={filters.showNotes}
                onChange={(e) => onFilterChange({ ...filters, showNotes: e.target.checked })}
                sx={{
                  p: 0.5,
                  color: '#F59E0B',
                  '&.Mui-checked': { color: '#F59E0B' },
                }}
              />
            }
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <StickyNote2 sx={{ fontSize: 15, color: '#F59E0B' }} />
                <Typography variant="body2" sx={{ fontSize: '0.78rem', fontWeight: 500 }}>
                  Personal Notes
                </Typography>
              </Box>
            }
          />
        </Box>
      </Box>

      <Divider />

      {/* Overview Stats Card */}
      <Card variant="outlined" sx={{ borderRadius: 1.5, background: 'rgba(140, 140, 160, 0.04)' }}>
        <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
          <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', color: 'text.secondary', display: 'block', mb: 0.5, fontSize: '0.65rem' }}>
            Range Summary
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0.5 }}>
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem' }}>Events</Typography>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#3B82F6', fontSize: '0.8rem' }}>
                {totalPhysicalEvents}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem' }}>Holidays</Typography>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#10B981', fontSize: '0.8rem' }}>
                {totalHolidays}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem' }}>Birthdays</Typography>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#EC4899', fontSize: '0.8rem' }}>
                {totalBirthdays}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem' }}>Notes</Typography>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#F59E0B', fontSize: '0.8rem' }}>
                {totalNotes}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};
