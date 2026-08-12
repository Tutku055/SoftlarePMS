import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Box, CircularProgress, Alert, Paper, Dialog, DialogTitle, DialogContent, Typography, CardActionArea, IconButton, Zoom } from '@mui/material';
import EventIcon from '@mui/icons-material/Event';
import NoteIcon from '@mui/icons-material/Note';
import CloseIcon from '@mui/icons-material/Close';
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
  const [searchParams, setSearchParams] = useSearchParams();
  const dateParam = searchParams.get('date');
  const viewParam = searchParams.get('view') as CalendarViewMode | null;

  const initialDate = useMemo(() => {
    if (dateParam) {
      const parsed = new Date(dateParam);
      if (!isNaN(parsed.getTime())) return parsed;
    }
    return new Date();
  }, [dateParam]);

  const initialViewMode = useMemo<CalendarViewMode>(() => {
    if (viewParam === 'agenda' || viewParam === 'day' || viewParam === 'week' || viewParam === 'month') {
      return viewParam;
    }
    return dateParam ? 'day' : 'month';
  }, [viewParam, dateParam]);

  const [currentDate, setCurrentDate] = useState<Date>(initialDate);
  const [viewMode, setViewMode] = useState<CalendarViewMode>(initialViewMode);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    if (dateParam || viewParam) {
      if (dateParam) {
        const parsed = new Date(dateParam);
        if (!isNaN(parsed.getTime())) {
          setCurrentDate(parsed);
        }
      }
      if (viewParam === 'agenda' || viewParam === 'day' || viewParam === 'week' || viewParam === 'month') {
        setViewMode(viewParam as CalendarViewMode);
      } else if (dateParam) {
        setViewMode('day');
      }
      // Clear param so subsequent normal navigations don't get stuck on this date
      setSearchParams({}, { replace: true });
    }
  }, [dateParam, viewParam, setSearchParams]);

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
  const [creationContext, setCreationContext] = useState<{dateStr?: string, hour?: number} | null>(null);

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
              onCellClick={(dateStr) => setCreationContext({ dateStr })}
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
              onTimeSlotClick={(dateStr, hour) => setCreationContext({ dateStr, hour })}
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
              onTimeSlotClick={(dateStr, hour) => setCreationContext({ dateStr, hour })}
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
      <Dialog
        open={!!creationContext}
        onClose={() => setCreationContext(null)}
        maxWidth="xs"
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            borderRadius: 4,
            backgroundImage: (theme: any) => theme.palette.mode === 'dark' 
              ? 'linear-gradient(to bottom right, rgba(255,255,255,0.05), rgba(0,0,0,0.2))' 
              : 'none',
            bgcolor: 'background.paper',
            boxShadow: (theme: any) => theme.palette.mode === 'dark' 
              ? '0 24px 48px rgba(0,0,0,0.6)' 
              : '0 24px 48px rgba(0,0,0,0.1)',
            overflow: 'hidden'
          }
        }}
      >
        <DialogTitle sx={{ m: 0, p: 3, pb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h5" component="div" sx={{ fontWeight: 800, background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Create New...
          </Typography>
          <IconButton
            aria-label="close"
            onClick={() => setCreationContext(null)}
            sx={{
              color: (theme) => theme.palette.grey[500],
              '&:hover': { bgcolor: 'action.hover', transition: 'all 0.3s' },
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ px: 3, pb: 4 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Select the type of item you'd like to add to your calendar.
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
            <Zoom in={!!creationContext} style={{ transitionDelay: '50ms' }}>
              <Paper
                elevation={0}
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 3,
                  overflow: 'hidden',
                  bgcolor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'background.paper',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    borderColor: 'primary.main',
                    boxShadow: (theme: any) => theme.palette.mode === 'dark' ? '0 8px 24px rgba(33, 150, 243, 0.3)' : '0 8px 24px rgba(33, 150, 243, 0.15)',
                    transform: 'translateY(-3px)'
                  }
                }}
              >
                <CardActionArea 
                  onClick={() => {
                    handleOpenCreateEvent(creationContext?.dateStr, creationContext?.hour);
                    setCreationContext(null);
                  }}
                  sx={{ p: 2.5, display: 'flex', alignItems: 'flex-start', gap: 2.5 }}
                >
                  <Box sx={{ p: 1.5, borderRadius: 2.5, bgcolor: 'primary.main', color: 'primary.contrastText', display: 'flex', boxShadow: '0 4px 12px rgba(33, 150, 243, 0.3)' }}>
                    <EventIcon fontSize="large" />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>Event</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5 }}>
                      Schedule a meeting, appointment, or set a specific time block.
                    </Typography>
                  </Box>
                </CardActionArea>
              </Paper>
            </Zoom>

            <Zoom in={!!creationContext} style={{ transitionDelay: '150ms' }}>
              <Paper
                elevation={0}
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 3,
                  overflow: 'hidden',
                  bgcolor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'background.paper',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    borderColor: 'secondary.main',
                    boxShadow: (theme: any) => theme.palette.mode === 'dark' ? '0 8px 24px rgba(156, 39, 176, 0.3)' : '0 8px 24px rgba(156, 39, 176, 0.15)',
                    transform: 'translateY(-3px)'
                  }
                }}
              >
                <CardActionArea 
                  onClick={() => {
                    handleOpenCreateNote(creationContext?.dateStr);
                    setCreationContext(null);
                  }}
                  sx={{ p: 2.5, display: 'flex', alignItems: 'flex-start', gap: 2.5 }}
                >
                  <Box sx={{ p: 1.5, borderRadius: 2.5, bgcolor: 'secondary.main', color: 'secondary.contrastText', display: 'flex', boxShadow: '0 4px 12px rgba(156, 39, 176, 0.3)' }}>
                    <NoteIcon fontSize="large" />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>Note</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5 }}>
                      Add a quick reminder, task, or information for this specific day.
                    </Typography>
                  </Box>
                </CardActionArea>
              </Paper>
            </Zoom>
          </Box>
        </DialogContent>
      </Dialog>

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
