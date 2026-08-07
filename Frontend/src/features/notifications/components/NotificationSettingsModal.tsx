import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Box,
  Typography,
  Alert,
  CircularProgress,
  Chip,
} from '@mui/material';
import { TuneRounded, EmailRounded, NotificationsActiveRounded, SecurityRounded } from '@mui/icons-material';
import type { NotificationTypeSettingDto } from '../types';
import { NotificationDeliveryChannel, NotificationType } from '../types';

interface NotificationSettingsModalProps {
  open: boolean;
  setting: NotificationTypeSettingDto | null;
  onClose: () => void;
  onSave: (
    type: number,
    reminderDays: number,
    deliveryChannel: NotificationDeliveryChannel
  ) => Promise<void>;
}

export const NotificationSettingsModal: React.FC<NotificationSettingsModalProps> = ({
  open,
  setting,
  onClose,
  onSave,
}) => {
  const [reminderDays, setReminderDays] = useState<number>(30);
  const [deliveryChannel, setDeliveryChannel] = useState<NotificationDeliveryChannel>(
    NotificationDeliveryChannel.System
  );
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (setting) {
      setReminderDays(setting.reminderDays);
      setDeliveryChannel(setting.deliveryChannel);
      setValidationError(null);
    }
  }, [setting, open]);

  if (!setting) return null;

  const handleSave = async () => {
    if (isNaN(reminderDays) || reminderDays < 0 || reminderDays > 365) {
      setValidationError('Reminder days must be an integer between 0 and 365.');
      return;
    }

    setValidationError(null);
    setIsSubmitting(true);
    try {
      await onSave(setting.type, reminderDays, deliveryChannel);
      onClose();
    } catch (err: any) {
      setValidationError(err?.message || 'Failed to save configuration.');
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
            p: 1,
          },
        },
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 1 }}>
        <TuneRounded color="primary" />
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Configure Notification Rule
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {setting.typeName}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, py: 2.5 }}>
        {validationError && <Alert severity="error">{validationError}</Alert>}

        <Typography variant="body2" color="text.secondary">
          {setting.description}
        </Typography>

        {/* Reminder Threshold Days / Per-Event / Anomaly Trigger Info */}
        <Box>
          {setting.type === NotificationType.SystemAnnouncement ? (
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                Continuous Anomaly Detection
              </Typography>
              <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                System announcements are evaluated continuously across 15-minute audit log windows. Severity (Low, Moderate, High, Critical) is calculated dynamically based on the volume and severity of detected events.
              </Typography>
            </Alert>
          ) : setting.type === NotificationType.EventUpcoming ? (
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                Per-Event Reminder Threshold
              </Typography>
              <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                Event reminder timing is not constrained by a global threshold. Each calendar event defines its own reminder window (e.g., on the event day, 1 day before, 1 week before) directly within the Calendar module.
              </Typography>
            </Alert>
          ) : (
            <TextField
              fullWidth
              type="number"
              label="Reminder Threshold (Days Ahead)"
              value={reminderDays}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                setReminderDays(isNaN(val) ? 0 : val);
              }}
              slotProps={{
                htmlInput: { min: 0, max: 365 },
              }}
              helperText="Number of days before the event or expiry date to trigger passive notifications (0 - 365)."
            />
          )}
        </Box>

        {/* Delivery Channel */}
        {setting.type === NotificationType.EventUpcoming ? (
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              Per-Event Delivery Preferences
            </Typography>
            <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
              Delivery channels (In-App notification and transactional Email reminder) are configured individually per event upon creation or modification in the Calendar module.
            </Typography>
          </Alert>
        ) : (
          <FormControl component="fieldset">
            <FormLabel component="legend" sx={{ fontWeight: 600, mb: 1, color: 'text.primary' }}>
              Delivery Channel
            </FormLabel>
            <RadioGroup
              value={deliveryChannel}
              onChange={(e) => setDeliveryChannel(Number(e.target.value) as NotificationDeliveryChannel)}
            >
              <FormControlLabel
                value={NotificationDeliveryChannel.System}
                control={<Radio />}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <NotificationsActiveRounded fontSize="small" color="action" />
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        In-App Only (System)
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Notifications appear inside user inboxes and badge indicators.
                      </Typography>
                    </Box>
                  </Box>
                }
                sx={{ mb: 1.5 }}
              />

              <FormControlLabel
                value={NotificationDeliveryChannel.SystemAndMail}
                control={<Radio />}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <EmailRounded fontSize="small" color="primary" />
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        In-App + Transactional Email
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Sends an instant branded SoftPMS HTML email notification in addition to in-app inbox.
                      </Typography>
                    </Box>
                  </Box>
                }
              />
            </RadioGroup>
          </FormControl>
        )}

        {/* Target Audience / Permission Info */}
        <Box
          sx={{
            p: 2,
            borderRadius: 2,
            backgroundColor: (theme) =>
              theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)',
            border: '1px solid',
            borderColor: (theme) => theme.palette.divider,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <SecurityRounded fontSize="small" color="primary" />
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              Authorized Target Audience
            </Typography>
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
            This notification is automatically filtered by the system RBAC engine. Only users whose assigned role contains at least one of the read permissions below (or SuperAdmin) will receive these notifications.
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {setting.requiredPermissions && setting.requiredPermissions.length > 0 ? (
              setting.requiredPermissions.map((perm) => (
                <Chip
                  key={perm}
                  size="small"
                  label={perm}
                  color="info"
                  variant="filled"
                  sx={{ fontWeight: 600 }}
                />
              ))
            ) : (
              <Chip
                size="small"
                label="All Active Users"
                variant="outlined"
                sx={{ fontWeight: 500 }}
              />
            )}
          </Box>
        </Box>

      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={isSubmitting} color="inherit">
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          color="primary"
          disabled={isSubmitting}
          startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : undefined}
          sx={{ fontWeight: 600, px: 3 }}
        >
          Save Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
};
