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
import { VisibilityLevel, type CalendarEventDto, type CreateCalendarEventPayload, type UpdateCalendarEventPayload } from '../../types/calendar.types';
import { useAuthStore } from '../../../../store/useAuthStore';
import { useDepartmentsLookup } from '../../../departments/hooks/useDepartmentsLookup';

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
          sendEmailReminder: isConfidential ? false : sendEmail,
          visibilityLevel: visibilityLevel,
          departmentId: isConfidential ? null : (departmentId || null),
        });
      } else {
        await onCreate({
          title: title.trim(),
          description: description.trim() || null,
          startTime: start.toISOString(),
          endTime: end.toISOString(),
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

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <TextField
              label="Start Date & Time"
              type="datetime-local"
              required
              fullWidth
              value={startDateTime}
              onChange={(e) => setStartDateTime(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
              disabled={isSubmitting || !canSaveActive}
            />
            <TextField
              label="End Date & Time"
              type="datetime-local"
              required
              fullWidth
              value={endDateTime}
              onChange={(e) => setEndDateTime(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
              disabled={isSubmitting || !canSaveActive}
            />
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
