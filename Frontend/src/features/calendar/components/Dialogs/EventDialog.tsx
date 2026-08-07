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
} from '@mui/material';
import { Close, DeleteOutlined, Event as EventIcon } from '@mui/icons-material';
import type { CalendarEventDto, CreateCalendarEventPayload, UpdateCalendarEventPayload } from '../../types/calendar.types';
import { useAuthStore } from '../../../../store/useAuthStore';

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
  const canCreate = hasPermission('Calendar.CreateEvent');
  const canUpdate = hasPermission('Calendar.UpdateEvent');
  const canDelete = hasPermission('Calendar.DeleteEvent');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDateTime, setStartDateTime] = useState('');
  const [endDateTime, setEndDateTime] = useState('');
  const [reminderDays, setReminderDays] = useState(1);
  const [sendEmail, setSendEmail] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditing = Boolean(eventToEdit);

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
      setError(null);
    } else {
      const targetDate = defaultDate ? new Date(`${defaultDate}T00:00:00`) : new Date();
      targetDate.setHours(defaultHour, 0, 0, 0);

      const endDate = new Date(targetDate);
      endDate.setHours(targetDate.getHours() + 1);

      setTitle('');
      setDescription('');
      setStartDateTime(formatToLocalDateTimeString(targetDate));
      setEndDateTime(formatToLocalDateTimeString(endDate));
      setReminderDays(1);
      setSendEmail(true);
      setError(null);
    }
  }, [eventToEdit, defaultDate, defaultHour, open]);

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

    const start = new Date(startDateTime);
    const end = new Date(endDateTime);

    if (end <= start) {
      setError('End time must be after start time.');
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
          startTime: start.toISOString(),
          endTime: end.toISOString(),
          reminderThresholdDays: reminderDays,
          sendEmailReminder: sendEmail,
        });
      } else {
        await onCreate({
          title: title.trim(),
          description: description.trim() || null,
          startTime: start.toISOString(),
          endTime: end.toISOString(),
          reminderThresholdDays: reminderDays,
          sendEmailReminder: sendEmail,
        });
      }
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'An error occurred while saving.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!eventToEdit) return;
    if (!window.confirm('Are you sure you want to delete this event?')) return;

    setIsSubmitting(true);
    try {
      await onDelete(eventToEdit.id);
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to delete event.');
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

          <TextField
            label="Event Title"
            required
            fullWidth
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isSubmitting || (isEditing && !canUpdate)}
            placeholder="e.g. Q4 Strategy Review Meeting"
            sx={{ mt: 0.5 }}
          />

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <TextField
              label="Start Date & Time"
              type="datetime-local"
              required
              fullWidth
              value={startDateTime}
              onChange={(e) => setStartDateTime(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
              disabled={isSubmitting || (isEditing && !canUpdate)}
            />
            <TextField
              label="End Date & Time"
              type="datetime-local"
              required
              fullWidth
              value={endDateTime}
              onChange={(e) => setEndDateTime(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
              disabled={isSubmitting || (isEditing && !canUpdate)}
            />
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, alignItems: 'center' }}>
            <TextField
              select
              label="Reminder Threshold"
              value={reminderDays}
              onChange={(e) => setReminderDays(Number(e.target.value))}
              fullWidth
              disabled={isSubmitting || (isEditing && !canUpdate)}
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
                  checked={sendEmail}
                  onChange={(e) => setSendEmail(e.target.checked)}
                  color="primary"
                  disabled={isSubmitting || (isEditing && !canUpdate)}
                />
              }
              label="Send Email Reminder"
            />
          </Box>

          <TextField
            label="Description (Optional)"
            multiline
            rows={3}
            fullWidth
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add agenda, meeting links, or notes..."
            disabled={isSubmitting || (isEditing && !canUpdate)}
          />
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5, pt: 1, justifyContent: 'space-between' }}>
          {isEditing && canDelete ? (
            <Button
              color="error"
              startIcon={<DeleteOutlined />}
              onClick={handleDelete}
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
            {((!isEditing && canCreate) || (isEditing && canUpdate)) && (
              <Button type="submit" variant="contained" color="primary" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Event'}
              </Button>
            )}
          </Box>
        </DialogActions>
      </form>
    </Dialog>
  );
};
