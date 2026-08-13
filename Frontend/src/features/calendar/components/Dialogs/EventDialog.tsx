import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControlLabel,
  Switch,
  MenuItem,
  Box,
  Typography,
  IconButton,
  Alert,
  RadioGroup,
  Radio,
  FormControl,
  InputLabel,
  Select,
  FormHelperText,
} from '@mui/material';
import { Close, DeleteOutlined, Event as EventIcon, Public, Lock } from '@mui/icons-material';
import { VisibilityLevel, CalendarEventType, type CalendarEventDto, type CreateCalendarEventPayload, type UpdateCalendarEventPayload } from '../../types/calendar.types';
import { toLocalISOStringWithOffset } from '../../utils/calendarDateUtils';
import { useAuthStore } from '../../../../store/useAuthStore';
import { useDepartmentsLookup } from '../../../departments';;

interface EventDialogProps {
  open: boolean;
  onClose: () => void;
  eventToEdit?: CalendarEventDto | null;
  defaultDate?: string; // YYYY-MM-DD
  defaultHour?: number;
  onCreate: (payload: CreateCalendarEventPayload) => Promise<void>;
  onUpdate: (id: string, payload: UpdateCalendarEventPayload) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export const EventDialog: React.FC<EventDialogProps> = ({
  open,
  onClose,
  eventToEdit,
  defaultDate,
  defaultHour = 9,
  onCreate,
  onUpdate,
  onDelete,
}) => {
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const canCreateStandard = hasPermission('Calendar.CreateEvent');
  const canCreateConfidential = hasPermission('Calendar.CreateConfidentialEvents');
  const canUpdateStandard = hasPermission('Calendar.UpdateEvent');
  const canUpdateConfidential = hasPermission('Calendar.UpdateConfidentialEvents');
  const canDeleteStandard = hasPermission('Calendar.DeleteEvent');
  const canDeleteConfidential = hasPermission('Calendar.DeleteConfidentialEvents');

  const { data: departments = [] } = useDepartmentsLookup();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDateTime, setStartDateTime] = useState('');
  const [endDateTime, setEndDateTime] = useState('');
  const [reminderDays, setReminderDays] = useState(1);
  const [sendEmail, setSendEmail] = useState(true);
  const [eventType, setEventType] = useState<CalendarEventType>(CalendarEventType.TimeBased);
  const [visibilityLevel, setVisibilityLevel] = useState<VisibilityLevel>(VisibilityLevel.Standard);
  const [departmentId, setDepartmentId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const isEditing = Boolean(eventToEdit);
  const isConfidential = visibilityLevel === VisibilityLevel.Confidential;

  const canCreateActive = isConfidential ? canCreateConfidential : canCreateStandard;
  const canUpdateActive = isConfidential ? canUpdateConfidential : canUpdateStandard;
  const canDeleteActive = eventToEdit?.visibilityLevel === VisibilityLevel.Confidential
    ? canDeleteConfidential
    : canDeleteStandard;

  const canSaveActive = isEditing ? canUpdateActive : canCreateActive;

  useEffect(() => {
    if (eventToEdit) {
      setTitle(eventToEdit.title);
      setDescription(eventToEdit.description || '');
      // Format to datetime-local input string YYYY-MM-DDTHH:mm
      const start = new Date(eventToEdit.startTime);
      const end = new Date(eventToEdit.endTime);
      setStartDateTime(formatToLocalDateTimeString(start));
      setEndDateTime(formatToLocalDateTimeString(end));
      setReminderDays(eventToEdit.reminderThresholdDays);
      setSendEmail(eventToEdit.sendEmailReminder);
      let initialEventType = eventToEdit.eventType;
      if (!initialEventType || (initialEventType !== CalendarEventType.TimeBased && initialEventType !== CalendarEventType.AllDay && initialEventType !== CalendarEventType.MultiDay)) {
        const s = eventToEdit.startTime.split('T')[0];
        const e = eventToEdit.endTime.split('T')[0];
        initialEventType = (s !== e) ? CalendarEventType.MultiDay : CalendarEventType.TimeBased;
      }

      setEventType(initialEventType);
      setVisibilityLevel(eventToEdit.visibilityLevel ?? VisibilityLevel.Standard);
      setDepartmentId(eventToEdit.departmentId || '');
      setError(null);
    } else {
      const targetDate = defaultDate ? new Date(`${defaultDate}T00:00:00`) : new Date();
      targetDate.setHours(defaultHour, 0, 0, 0);

      const endDate = new Date(targetDate);
      endDate.setHours(targetDate.getHours() + 1);

      const defaultVis = canCreateStandard ? VisibilityLevel.Standard : (canCreateConfidential ? VisibilityLevel.Confidential : VisibilityLevel.Standard);

      setTitle('');
      setDescription('');
      setStartDateTime(formatToLocalDateTimeString(targetDate));
      setEndDateTime(formatToLocalDateTimeString(endDate));
      setReminderDays(1);
      setSendEmail(true);
      setEventType(CalendarEventType.TimeBased);
      setVisibilityLevel(defaultVis);
      setDepartmentId('');
      setError(null);
    }
  }, [eventToEdit, defaultDate, defaultHour, open, canCreateStandard, canCreateConfidential]);

  function formatToLocalDateTimeString(d: Date): string {
    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    const year = d.getFullYear();
    const month = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    const hours = pad(d.getHours());
    const minutes = pad(d.getMinutes());
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Event title is required.');
      return;
    }

    let finalStart = new Date(startDateTime);
    let finalEnd = new Date(endDateTime);

    let payloadEventType = eventType;

    if (eventType === CalendarEventType.AllDay) {
      finalStart.setHours(0, 0, 0, 0);
      finalEnd = new Date(finalStart);
      finalEnd.setHours(23, 59, 59, 0);
    } else if (eventType === CalendarEventType.MultiDay) {
      finalStart.setHours(0, 0, 0, 0);
      finalEnd.setHours(23, 59, 59, 0);
      if (finalStart.toDateString() === finalEnd.toDateString()) {
        payloadEventType = CalendarEventType.AllDay;
      }
    } else if (eventType === CalendarEventType.TimeBased) {
      // Ensure time-based events end on the exact same date to pass backend validation
      const year = finalStart.getFullYear();
      const month = finalStart.getMonth();
      const date = finalStart.getDate();
      finalEnd.setFullYear(year, month, date);
    }

    if (finalEnd < finalStart) {
      setError('End time must be on or after start time.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (isEditing && eventToEdit) {
        await onUpdate(eventToEdit.id, {
          id: eventToEdit.id,
          title: title.trim(),
          description: description.trim() || null,
          startTime: toLocalISOStringWithOffset(finalStart),
          endTime: toLocalISOStringWithOffset(finalEnd),
          eventType: payloadEventType,
          reminderThresholdDays: reminderDays,
          sendEmailReminder: sendEmail,
          visibilityLevel,
          departmentId: visibilityLevel === VisibilityLevel.Confidential ? null : (departmentId || null),
        });
      } else {
        await onCreate({
          title: title.trim(),
          description: description.trim() || null,
          startTime: toLocalISOStringWithOffset(finalStart),
          endTime: toLocalISOStringWithOffset(finalEnd),
          eventType: payloadEventType,
          reminderThresholdDays: reminderDays,
          sendEmailReminder: isConfidential ? false : sendEmail,
          visibilityLevel: visibilityLevel,
          departmentId: isConfidential ? null : (departmentId || null),
        });
      }
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'An error occurred while saving.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = () => {
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!eventToEdit) return;

    setIsSubmitting(true);
    try {
      await onDelete(eventToEdit.id);
      setDeleteConfirmOpen(false);
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to delete event.');
      setDeleteConfirmOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: 3,
            bgcolor: 'background.paper',
            backgroundImage: 'none',
          },
        },
      }}
    >
      <form onSubmit={handleSubmit}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1, pt: 2.5, px: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <EventIcon color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {isEditing ? 'Edit Company Event' : 'Create Company Event'}
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <Close fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: '20px !important', px: 3 }}>
          {error && <Alert severity="error" sx={{ mb: 0.5 }}>{error}</Alert>}

          {isEditing && eventToEdit?.authorName && (
            <Typography variant="caption" color="text.secondary">
              Created by: <strong>{eventToEdit.authorName}</strong>
            </Typography>
          )}

          <TextField
            label="Event Title"
            required
            fullWidth
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isSubmitting || !canSaveActive}
            placeholder="e.g. Q4 Strategy Review Meeting"
            sx={{ mt: 0.5 }}
          />

          <Box>
            <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', color: 'text.secondary', mb: 1, display: 'block' }}>
              Event Type
            </Typography>
            <RadioGroup
              row
              value={eventType}
              onChange={(e) => {
                const newType = Number(e.target.value) as CalendarEventType;
                setEventType(newType);
                
                const startDatePart = startDateTime.split('T')[0];
                const endDatePart = endDateTime.split('T')[0];

                if (newType === CalendarEventType.TimeBased || newType === CalendarEventType.AllDay) {
                  // Force End Date to match Start Date
                  const endTimePart = endDateTime.includes('T') ? endDateTime.split('T')[1] : (newType === CalendarEventType.AllDay ? '23:59' : '10:00');
                  setEndDateTime(`${startDatePart}T${endTimePart}`);
                } else if (newType === CalendarEventType.MultiDay) {
                  // If startDate == endDate when switching to Multi-Day, default end date to +1 day automatically
                  if (startDatePart === endDatePart) {
                    const sDate = new Date(`${startDatePart}T00:00:00`);
                    sDate.setDate(sDate.getDate() + 1);
                    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
                    const nextDayStr = `${sDate.getFullYear()}-${pad(sDate.getMonth() + 1)}-${pad(sDate.getDate())}`;
                    setEndDateTime(`${nextDayStr}T23:59`);
                  }
                }
              }}
            >
              <FormControlLabel value={CalendarEventType.TimeBased} control={<Radio size="small" />} label="Time-Based" disabled={isSubmitting || !canSaveActive} />
              <FormControlLabel value={CalendarEventType.AllDay} control={<Radio size="small" />} label="All-Day" disabled={isSubmitting || !canSaveActive} />
              <FormControlLabel value={CalendarEventType.MultiDay} control={<Radio size="small" />} label="Multi-Day" disabled={isSubmitting || !canSaveActive} />
            </RadioGroup>
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: eventType === CalendarEventType.AllDay ? '1fr' : '1fr 1fr', gap: 2 }}>
            {eventType === CalendarEventType.TimeBased ? (
              <>
                <TextField
                  label="Event Date"
                  type="date"
                  required
                  fullWidth
                  sx={{ gridColumn: 'span 2' }}
                  value={startDateTime.split('T')[0]}
                  onChange={(e) => {
                    const newDate = e.target.value;
                    const startTimePart = startDateTime.split('T')[1] || '09:00';
                    const endTimePart = endDateTime.split('T')[1] || '10:00';
                    setStartDateTime(`${newDate}T${startTimePart}`);
                    setEndDateTime(`${newDate}T${endTimePart}`);
                  }}
                  slotProps={{ inputLabel: { shrink: true } }}
                  disabled={isSubmitting || !canSaveActive}
                />
                <TextField
                  label="Start Time"
                  type="time"
                  required
                  fullWidth
                  value={startDateTime.split('T')[1]?.substring(0, 5) || '09:00'}
                  onChange={(e) => {
                    const datePart = startDateTime.split('T')[0];
                    setStartDateTime(`${datePart}T${e.target.value}`);
                  }}
                  slotProps={{ inputLabel: { shrink: true } }}
                  disabled={isSubmitting || !canSaveActive}
                />
                <TextField
                  label="End Time"
                  type="time"
                  required
                  fullWidth
                  value={endDateTime.split('T')[1]?.substring(0, 5) || '10:00'}
                  onChange={(e) => {
                    const datePart = endDateTime.split('T')[0];
                    setEndDateTime(`${datePart}T${e.target.value}`);
                  }}
                  slotProps={{ inputLabel: { shrink: true } }}
                  disabled={isSubmitting || !canSaveActive}
                />
              </>
            ) : (
              <>
                <TextField
                  label="Start Date"
                  type="date"
                  required
                  fullWidth
                  value={startDateTime.split('T')[0]}
                  onChange={(e) => {
                    const newStartDate = e.target.value;
                    setStartDateTime(`${newStartDate}T00:00`);
                    if (eventType === CalendarEventType.AllDay) {
                      setEndDateTime(`${newStartDate}T23:59`);
                    } else if (eventType === CalendarEventType.MultiDay) {
                      const endDatePart = endDateTime.split('T')[0];
                      if (newStartDate >= endDatePart) {
                        const sDate = new Date(`${newStartDate}T00:00:00`);
                        sDate.setDate(sDate.getDate() + 1);
                        const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
                        const nextDayStr = `${sDate.getFullYear()}-${pad(sDate.getMonth() + 1)}-${pad(sDate.getDate())}`;
                        setEndDateTime(`${nextDayStr}T23:59`);
                      }
                    }
                  }}
                  slotProps={{ inputLabel: { shrink: true } }}
                  disabled={isSubmitting || !canSaveActive}
                />
                {eventType === CalendarEventType.MultiDay && (
                  <TextField
                    label="End Date"
                    type="date"
                    required
                    fullWidth
                    value={endDateTime.split('T')[0]}
                    onChange={(e) => {
                      const newEndDate = e.target.value;
                      const startDatePart = startDateTime.split('T')[0];
                      if (newEndDate === startDatePart) {
                        // User picked the same date for End Date in Multi-Day mode -> auto-revert to All-Day!
                        setEventType(CalendarEventType.AllDay);
                        setEndDateTime(`${newEndDate}T23:59`);
                      } else {
                        setEndDateTime(`${newEndDate}T23:59`);
                      }
                    }}
                    slotProps={{ inputLabel: { shrink: true } }}
                    disabled={isSubmitting || !canSaveActive}
                  />
                )}
              </>
            )}
          </Box>

          {/* Visibility Level */}
          <Box>
            <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', color: 'text.secondary', mb: 1, display: 'block' }}>
              Visibility Level
            </Typography>
            <RadioGroup
              row
              value={visibilityLevel}
              onChange={(e) => {
                const newLevel = Number(e.target.value) as VisibilityLevel;
                setVisibilityLevel(newLevel);
              }}
            >
              <FormControlLabel
                value={VisibilityLevel.Standard}
                control={<Radio size="small" />}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Public fontSize="small" color="action" />
                    <Typography variant="body2">Standard (Public - visible to team)</Typography>
                  </Box>
                }
                disabled={isSubmitting || (isEditing ? !canUpdateStandard : !canCreateStandard)}
              />
              <FormControlLabel
                value={VisibilityLevel.Confidential}
                control={<Radio size="small" />}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Lock fontSize="small" color="warning" />
                    <Typography variant="body2">Confidential (Private)</Typography>
                  </Box>
                }
                disabled={isSubmitting || (isEditing ? !canUpdateConfidential : !canCreateConfidential)}
              />
            </RadioGroup>
            {isConfidential && (
              <Alert severity="warning" sx={{ mt: 1, py: 0.5, fontSize: '0.8rem' }}>
                Private events cannot be sent to employees via email. Only authorized system users receive in-app notifications.
              </Alert>
            )}
          </Box>

          {/* Reminders & Target Department */}
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, alignItems: 'center' }}>
            <TextField
              select
              label="Reminder Threshold"
              value={reminderDays}
              onChange={(e) => setReminderDays(Number(e.target.value))}
              fullWidth
              disabled={isSubmitting || !canSaveActive}
            >
              <MenuItem value={0}>On the event day</MenuItem>
              <MenuItem value={1}>1 day before</MenuItem>
              <MenuItem value={2}>2 days before</MenuItem>
              <MenuItem value={3}>3 days before</MenuItem>
              <MenuItem value={7}>1 week before</MenuItem>
              <MenuItem value={14}>2 weeks before</MenuItem>
            </TextField>

            <FormControlLabel
              control={
                <Switch
                  checked={!isConfidential && sendEmail}
                  onChange={(e) => setSendEmail(e.target.checked)}
                  color="primary"
                  disabled={isSubmitting || !canSaveActive || isConfidential}
                />
              }
              label="Send Email Reminder"
            />
          </Box>

          {/* Department Selection Box */}
          <FormControl fullWidth size="medium" disabled={isSubmitting || !canSaveActive || isConfidential}>
            <InputLabel id="event-department-select-label" shrink>
              Target Department (Email Reminder)
            </InputLabel>
            <Select
              labelId="event-department-select-label"
              id="event-department-select"
              value={departmentId}
              label="Target Department (Email Reminder)"
              onChange={(e) => setDepartmentId(e.target.value)}
              MenuProps={{ disableScrollLock: true }}
              displayEmpty
              notched
              renderValue={(val) =>
                val === '' ? (
                  <em style={{ color: 'inherit', opacity: 0.55 }}>All Departments (All Employees)</em>
                ) : (
                  departments.find((d) => d.id === val)?.name ?? val
                )
              }
            >
              <MenuItem value="">
                <em>All Departments (All Employees)</em>
              </MenuItem>
              {departments.map((dept) => (
                <MenuItem key={dept.id} value={dept.id}>
                  {dept.name}
                </MenuItem>
              ))}
            </Select>
            <FormHelperText>
              {isConfidential
                ? 'Department targeting is disabled for private events.'
                : 'Choose a specific department to limit email reminders to its employees, or select All.'}
            </FormHelperText>
          </FormControl>

          <TextField
            label="Description (Optional)"
            multiline
            rows={3}
            fullWidth
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add agenda, meeting links, or notes..."
            disabled={isSubmitting || !canSaveActive}
          />
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5, pt: 1, justifyContent: 'space-between' }}>
          {isEditing && canDeleteActive ? (
            <Button
              color="error"
              startIcon={<DeleteOutlined />}
              onClick={handleDeleteClick}
              disabled={isSubmitting}
            >
              Delete
            </Button>
          ) : (
            <Box />
          )}

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            {canSaveActive && (
              <Button type="submit" variant="contained" color="primary" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Event'}
              </Button>
            )}
          </Box>
        </DialogActions>
      </form>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => !isSubmitting && setDeleteConfirmOpen(false)}
        maxWidth="xs"
        fullWidth
        slotProps={{
          paper: {
            sx: { borderRadius: 3, p: 1 },
          },
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <DeleteOutlined color="error" />
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Delete Event
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Are you sure you want to delete the event <strong>{eventToEdit?.title}</strong>? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteConfirmOpen(false)} disabled={isSubmitting} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDelete}
            color="error"
            variant="contained"
            disabled={isSubmitting}
            sx={{ fontWeight: 600 }}
          >
            {isSubmitting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
};
