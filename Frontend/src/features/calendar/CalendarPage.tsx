import React, { useState, useMemo } from 'react';
import { Box, CircularProgress, Alert, Paper } from '@mui/material';
import type {
  CalendarViewMode,
  CalendarFilters,
  CalendarEventDto,
  CalendarNoteDto,
  VirtualCalendarEventDto,
  CreateCalendarEventPayload,
  UpdateCalendarEventPayload,
  CreateCalendarNotePayload,
  UpdateCalendarNotePayload,
  UpdateCalendarSettingsPayload,
} from './types/calendar.types';
import {
  getMonthGridRange,
  getWeekRange,
  getDayRange,
  getAgendaRange,
  formatDateToIso,
} from './utils/calendarDateUtils';
import { useCalendarRange, useCalendarSettings } from './hooks/useCalendarData';
import { useCalendarMutations } from './hooks/useCalendarMutations';
import { CalendarHeader } from './components/CalendarHeader';
import { CalendarSidebar } from './components/CalendarSidebar';
import { MonthView } from './components/Views/MonthView';
import { WeekView } from './components/Views/WeekView';
import { DayView } from './components/Views/DayView';
import { AgendaView } from './components/Views/AgendaView';
import { EventDialog } from './components/Dialogs/EventDialog';
import { NoteDialog } from './components/Dialogs/NoteDialog';
import { VirtualEventDialog } from './components/Dialogs/VirtualEventDialog';
import { CalendarSettingsDialog } from './components/Dialogs/CalendarSettingsDialog';
import styles from './components/Calendar.module.css';

export const CalendarPage: React.FC = () => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Category filters
  const [filters, setFilters] = useState<CalendarFilters>({
    showPhysicalEvents: true,
    showHolidays: true,
    showBirthdays: true,
    showNotes: true,
  });

  // Dialog States
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<CalendarEventDto | null>(null);

  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false);
  const [noteToEdit, setNoteToEdit] = useState<CalendarNoteDto | null>(null);

  const [isVirtualDialogOpen, setIsVirtualDialogOpen] = useState(false);
  const [virtualEventToView, setVirtualEventToView] = useState<VirtualCalendarEventDto | null>(null);

  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);

  const [defaultDateForCreate, setDefaultDateForCreate] = useState<string | undefined>(undefined);
  const [defaultHourForCreate, setDefaultHourForCreate] = useState<number | undefined>(undefined);

  // Calculate dynamic date boundaries
  const { startDate, endDate, dates } = useMemo(() => {
    switch (viewMode) {
      case 'month':
        return getMonthGridRange(currentDate);
      case 'week':
        return getWeekRange(currentDate);
      case 'day':
        return getDayRange(currentDate);
      case 'agenda':
        return getAgendaRange(currentDate, 30);
      default:
        return getMonthGridRange(currentDate);
    }
  }, [currentDate, viewMode]);

  // Data queries
  const { data: calendarData = [], isLoading, isError, error } = useCalendarRange(startDate, endDate);
  const { data: settingsData } = useCalendarSettings();

  // Mutations
  const {
    createEventMutation,
    updateEventMutation,
    deleteEventMutation,
    createNoteMutation,
    updateNoteMutation,
    deleteNoteMutation,
    updateSettingsMutation,
  } = useCalendarMutations();

  // Navigation handlers
  const handlePrev = () => {
    setCurrentDate((prev) => {
      const d = new Date(prev);
      if (viewMode === 'month') d.setMonth(d.getMonth() - 1);
      else if (viewMode === 'week') d.setDate(d.getDate() - 7);
      else if (viewMode === 'day') d.setDate(d.getDate() - 1);
      else if (viewMode === 'agenda') d.setDate(d.getDate() - 30);
      return d;
    });
  };

  const handleNext = () => {
    setCurrentDate((prev) => {
      const d = new Date(prev);
      if (viewMode === 'month') d.setMonth(d.getMonth() + 1);
      else if (viewMode === 'week') d.setDate(d.getDate() + 7);
      else if (viewMode === 'day') d.setDate(d.getDate() + 1);
      else if (viewMode === 'agenda') d.setDate(d.getDate() + 30);
      return d;
    });
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleSelectMiniDate = (d: Date) => {
    setCurrentDate(d);
  };

  // Open dialogs
  const handleOpenCreateEvent = (date?: string, hour?: number) => {
    setEventToEdit(null);
    setDefaultDateForCreate(date || formatDateToIso(currentDate));
    setDefaultHourForCreate(hour ?? 9);
    setIsEventDialogOpen(true);
  };

  const handleOpenCreateNote = (date?: string) => {
    setNoteToEdit(null);
    setDefaultDateForCreate(date || formatDateToIso(currentDate));
    setIsNoteDialogOpen(true);
  };

  const handleSelectEvent = (evt: CalendarEventDto) => {
    setEventToEdit(evt);
    setIsEventDialogOpen(true);
  };

  const handleSelectNote = (note: CalendarNoteDto) => {
    setNoteToEdit(note);
    setIsNoteDialogOpen(true);
  };

  const handleSelectVirtualEvent = (vEvent: VirtualCalendarEventDto) => {
    setVirtualEventToView(vEvent);
    setIsVirtualDialogOpen(true);
  };

  // Mutation executors
  const handleCreateEvent = async (payload: CreateCalendarEventPayload) => {
    await createEventMutation.mutateAsync(payload);
  };

  const handleUpdateEvent = async (id: string, payload: UpdateCalendarEventPayload) => {
    await updateEventMutation.mutateAsync({ id, payload });
  };

  const handleDeleteEvent = async (id: string) => {
    await deleteEventMutation.mutateAsync(id);
  };

  const handleCreateNote = async (payload: CreateCalendarNotePayload) => {
    await createNoteMutation.mutateAsync(payload);
  };

  const handleUpdateNote = async (id: string, payload: UpdateCalendarNotePayload) => {
    await updateNoteMutation.mutateAsync({ id, payload });
  };

  const handleDeleteNote = async (id: string) => {
    await deleteNoteMutation.mutateAsync(id);
  };

  const handleUpdateSettings = async (payload: UpdateCalendarSettingsPayload) => {
    await updateSettingsMutation.mutateAsync(payload);
  };

  return (
    <Paper
      elevation={2}
      className={styles.calendarContainer}
      sx={{
        border: (theme) => `1px solid ${theme.palette.divider}`,
        bgcolor: 'background.paper',
      }}
    >
      {/* Top Header */}
      <CalendarHeader
        currentDate={currentDate}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onPrev={handlePrev}
        onNext={handleNext}
        onToday={handleToday}
        onOpenCreateEvent={() => handleOpenCreateEvent()}
        onOpenCreateNote={() => handleOpenCreateNote()}
        onOpenSettings={() => setIsSettingsDialogOpen(true)}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
      />

      {/* Main body */}
      <Box className={styles.mainLayout}>
        {/* Left Side Navigator & Filters */}
        <CalendarSidebar
          isOpen={isSidebarOpen}
          selectedDate={currentDate}
          onSelectDate={handleSelectMiniDate}
          filters={filters}
          onFilterChange={setFilters}
          calendarData={calendarData}
        />

        {/* View Grid Area */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
          {isLoading && (
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(17, 24, 39, 0.65)' : 'rgba(255, 255, 255, 0.65)'),
                backdropFilter: 'blur(2px)',
                zIndex: 20,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CircularProgress size={40} />
            </Box>
          )}

          {isError && (
            <Box sx={{ p: 2 }}>
              <Alert severity="error">
                Failed to load calendar events: {(error as any)?.message || 'Unknown error'}
              </Alert>
            </Box>
          )}

          {viewMode === 'month' && (
            <MonthView
              dates={dates}
              currentMonth={currentDate.getMonth()}
              calendarData={calendarData}
              filters={filters}
              onSelectEvent={handleSelectEvent}
              onSelectNote={handleSelectNote}
              onSelectVirtualEvent={handleSelectVirtualEvent}
              onCellClick={(dateStr) => handleOpenCreateEvent(dateStr)}
            />
          )}

          {viewMode === 'week' && (
            <WeekView
              dates={dates}
              calendarData={calendarData}
              filters={filters}
              onSelectEvent={handleSelectEvent}
              onSelectNote={handleSelectNote}
              onSelectVirtualEvent={handleSelectVirtualEvent}
              onTimeSlotClick={(dateStr, hour) => handleOpenCreateEvent(dateStr, hour)}
            />
          )}

          {viewMode === 'day' && (
            <DayView
              currentDate={currentDate}
              calendarData={calendarData}
              filters={filters}
              onSelectEvent={handleSelectEvent}
              onSelectNote={handleSelectNote}
              onSelectVirtualEvent={handleSelectVirtualEvent}
              onTimeSlotClick={(dateStr, hour) => handleOpenCreateEvent(dateStr, hour)}
            />
          )}

          {viewMode === 'agenda' && (
            <AgendaView
              calendarData={calendarData}
              filters={filters}
              onSelectEvent={handleSelectEvent}
              onSelectNote={handleSelectNote}
              onSelectVirtualEvent={handleSelectVirtualEvent}
            />
          )}
        </Box>
      </Box>

      {/* Dialogs */}
      <EventDialog
        open={isEventDialogOpen}
        onClose={() => setIsEventDialogOpen(false)}
        eventToEdit={eventToEdit}
        defaultDate={defaultDateForCreate}
        defaultHour={defaultHourForCreate}
        onCreate={handleCreateEvent}
        onUpdate={handleUpdateEvent}
        onDelete={handleDeleteEvent}
      />

      <NoteDialog
        open={isNoteDialogOpen}
        onClose={() => setIsNoteDialogOpen(false)}
        noteToEdit={noteToEdit}
        defaultDate={defaultDateForCreate}
        onCreate={handleCreateNote}
        onUpdate={handleUpdateNote}
        onDelete={handleDeleteNote}
      />

      <VirtualEventDialog
        open={isVirtualDialogOpen}
        onClose={() => setIsVirtualDialogOpen(false)}
        virtualEvent={virtualEventToView}
      />

      <CalendarSettingsDialog
        open={isSettingsDialogOpen}
        onClose={() => setIsSettingsDialogOpen(false)}
        settings={settingsData}
        onSave={handleUpdateSettings}
      />
    </Paper>
  );
};
export default CalendarPage;
