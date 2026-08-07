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
  Divider,
} from '@mui/material';
import { Close, Settings as SettingsIcon, Celebration, Cake } from '@mui/icons-material';
import type { CalendarSettingsDto, UpdateCalendarSettingsPayload } from '../../types/calendar.types';
import { useAuthStore } from '../../../../store/useAuthStore';

interface CalendarSettingsDialogProps {
  open: boolean;
  onClose: () => void;
  settings?: CalendarSettingsDto | null;
  onSave: (payload: UpdateCalendarSettingsPayload) => Promise<void>;
}

const SUPPORTED_COUNTRIES = [
  { code: 'TR', name: 'Turkey 🇹🇷' },
  { code: 'NL', name: 'Netherlands 🇳🇱' },
  { code: 'DE', name: 'Germany 🇩🇪' },
  { code: 'US', name: 'United States 🇺🇸' },
  { code: 'GB', name: 'United Kingdom 🇬🇧' },
  { code: 'FR', name: 'France 🇫🇷' },
  { code: 'CA', name: 'Canada 🇨🇦' },
  { code: 'AU', name: 'Australia 🇦🇺' },
  { code: 'IT', name: 'Italy 🇮🇹' },
  { code: 'ES', name: 'Spain 🇪🇸' },
  { code: 'CH', name: 'Switzerland 🇨🇭' },
  { code: 'BE', name: 'Belgium 🇧🇪' },
  { code: 'AT', name: 'Austria 🇦🇹' },
  { code: 'SE', name: 'Sweden 🇸🇪' },
  { code: 'NO', name: 'Norway 🇳🇴' },
  { code: 'PL', name: 'Poland 🇵🇱' },
  { code: 'IE', name: 'Ireland 🇮🇪' },
  { code: 'JP', name: 'Japan 🇯🇵' },
];

export const CalendarSettingsDialog: React.FC<CalendarSettingsDialogProps> = ({
  open,
  onClose,
  settings,
  onSave,
}) => {
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const canManage = hasPermission('Calendar.ManageSettings');

  const [holidayCountryCode, setHolidayCountryCode] = useState('TR');
  const [holidayReminderDays, setHolidayReminderDays] = useState(3);
  const [sendEmailForHolidays, setSendEmailForHolidays] = useState(true);
  const [birthdayReminderDays, setBirthdayReminderDays] = useState(1);
  const [sendEmailForBirthdays, setSendEmailForBirthdays] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (settings) {
      setHolidayCountryCode(settings.holidayCountryCode || 'TR');
      setHolidayReminderDays(settings.holidayReminderDays ?? 3);
      setSendEmailForHolidays(settings.sendEmailForHolidays ?? true);
      setBirthdayReminderDays(settings.birthdayReminderDays ?? 1);
      setSendEmailForBirthdays(settings.sendEmailForBirthdays ?? true);
      setError(null);
    }
  }, [settings, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await onSave({
        holidayCountryCode,
        holidayReminderDays,
        sendEmailForHolidays,
        birthdayReminderDays,
        sendEmailForBirthdays,
      });
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to update calendar settings.');
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
            <SettingsIcon color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Calendar Configuration
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <Close fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: '20px !important', px: 3 }}>
          {error && <Alert severity="error" sx={{ mb: 0.5 }}>{error}</Alert>}

          {/* Public Holidays Section */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 0.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Celebration sx={{ color: '#10B981' }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                Public Holidays Settings
              </Typography>
            </Box>

            <TextField
              select
              label="Country / Region"
              value={holidayCountryCode}
              onChange={(e) => setHolidayCountryCode(e.target.value)}
              fullWidth
              disabled={isSubmitting || !canManage}
            >
              {SUPPORTED_COUNTRIES.map((c) => (
                <MenuItem key={c.code} value={c.code}>
                  {c.name} ({c.code})
                </MenuItem>
              ))}
            </TextField>

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, alignItems: 'center' }}>
              <TextField
                select
                label="Holiday Reminder"
                value={holidayReminderDays}
                onChange={(e) => setHolidayReminderDays(Number(e.target.value))}
                fullWidth
                disabled={isSubmitting || !canManage}
              >
                <MenuItem value={0}>On holiday day</MenuItem>
                <MenuItem value={1}>1 day before</MenuItem>
                <MenuItem value={2}>2 days before</MenuItem>
                <MenuItem value={3}>3 days before</MenuItem>
                <MenuItem value={5}>5 days before</MenuItem>
                <MenuItem value={7}>1 week before</MenuItem>
              </TextField>

              <FormControlLabel
                control={
                  <Switch
                    checked={sendEmailForHolidays}
                    onChange={(e) => setSendEmailForHolidays(e.target.checked)}
                    color="primary"
                    disabled={isSubmitting || !canManage}
                  />
                }
                label="Send Email"
              />
            </Box>
          </Box>

          <Divider />

          {/* Birthday Settings Section */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Cake sx={{ color: '#EC4899' }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                Employee Birthday Settings
              </Typography>
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, alignItems: 'center' }}>
              <TextField
                select
                label="Birthday Reminder"
                value={birthdayReminderDays}
                onChange={(e) => setBirthdayReminderDays(Number(e.target.value))}
                fullWidth
                disabled={isSubmitting || !canManage}
              >
                <MenuItem value={0}>On birthday</MenuItem>
                <MenuItem value={1}>1 day before</MenuItem>
                <MenuItem value={2}>2 days before</MenuItem>
                <MenuItem value={3}>3 days before</MenuItem>
                <MenuItem value={5}>5 days before</MenuItem>
                <MenuItem value={7}>1 week before</MenuItem>
              </TextField>

              <FormControlLabel
                control={
                  <Switch
                    checked={sendEmailForBirthdays}
                    onChange={(e) => setSendEmailForBirthdays(e.target.checked)}
                    color="primary"
                    disabled={isSubmitting || !canManage}
                  />
                }
                label="Send Email"
              />
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5, pt: 1 }}>
          <Button onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          {canManage && (
            <Button type="submit" variant="contained" color="primary" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Settings'}
            </Button>
          )}
        </DialogActions>
      </form>
    </Dialog>
  );
};
