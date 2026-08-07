import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Switch,
  FormControlLabel,
  Button,
  Chip,
  Alert,
  CircularProgress,
  Divider,
  useTheme,
} from '@mui/material';
import {
  RefreshRounded,
  EditRounded,
  AccessTimeRounded,
  CheckCircleOutlineRounded,
  NotificationsActiveRounded,
  EmailRounded,
  PlayArrowRounded,
} from '@mui/icons-material';
import { useAuthStore } from '../../../store/useAuthStore';
import { useNotificationSettings } from '../hooks/useNotificationSettings';
import { NotificationSettingsModal } from './NotificationSettingsModal';
import type { NotificationTypeSettingDto } from '../types';
import { NotificationDeliveryChannel, NotificationType } from '../types';
import { NOTIFICATION_TYPE_CONFIG } from '../utils/urgencyUtils';

export const NotificationSettingsView: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const hasPermission = useAuthStore((state) => state.hasPermission);

  const canAdjustThresholds = hasPermission('Notifications.AdjustThresholds');
  const canMute = hasPermission('Notifications.Mute');

  const {
    settings,
    isLoading,
    isSaving,
    isEvaluating,
    evaluationResult,
    error,
    refetch,
    adjustThreshold,
    toggleMute,
    triggerEvaluation,
    clearEvaluationResult,
  } = useNotificationSettings();

  const [selectedSetting, setSelectedSetting] = useState<NotificationTypeSettingDto | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  const handleOpenEdit = (setting: NotificationTypeSettingDto) => {
    setSelectedSetting(setting);
    setModalOpen(true);
  };

  const handleSaveModal = async (
    type: number,
    reminderDays: number,
    deliveryChannel: NotificationDeliveryChannel
  ) => {
    await adjustThreshold(type as any, reminderDays, deliveryChannel);
    setActionSuccessMsg('Notification rule threshold updated successfully.');
    setTimeout(() => setActionSuccessMsg(null), 4000);
  };

  const handleToggleMute = async (setting: NotificationTypeSettingDto) => {
    if (!canMute || isSaving) return;
    try {
      await toggleMute(setting.type, !setting.isMuted);
      setActionSuccessMsg(
        `Notification type "${setting.typeName}" is now ${!setting.isMuted ? 'muted' : 'active'}.`
      );
      setTimeout(() => setActionSuccessMsg(null), 4000);
    } catch {
      // Handled by hook error state
    }
  };

  const handleRunEvaluation = async () => {
    if (isEvaluating) return;
    try {
      await triggerEvaluation();
    } catch {
      // Handled by hook error state
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Action Banners */}
      {error && <Alert severity="error">{error}</Alert>}

      {actionSuccessMsg && (
        <Alert severity="success" icon={<CheckCircleOutlineRounded />}>
          {actionSuccessMsg}
        </Alert>
      )}

      {evaluationResult && (
        <Alert
          severity="info"
          onClose={clearEvaluationResult}
          sx={{ display: 'flex', alignItems: 'center' }}
        >
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            Passive Evaluation Completed!
          </Typography>
          <Box sx={{ mt: 0.5, display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
            {Object.entries(evaluationResult).map(([rule, count]) => (
              <Chip
                key={rule}
                size="small"
                label={`${rule}: ${count} dispatched`}
                color="info"
                variant="outlined"
              />
            ))}
          </Box>
        </Alert>
      )}

      {/* Header controls bar */}
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
          p: 2,
          borderRadius: 2.5,
          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
          border: '1px solid',
          borderColor: (theme) => theme.palette.divider,
        }}
      >
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            Passive Notification Rules
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Configure system reminder thresholds, muting states, and email delivery channels.
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Button
            size="small"
            variant="outlined"
            startIcon={<RefreshRounded />}
            onClick={() => refetch()}
            disabled={isLoading}
          >
            Refresh Rules
          </Button>

          {canAdjustThresholds && (
            <Button
              size="small"
              variant="contained"
              color="primary"
              startIcon={isEvaluating ? <CircularProgress size={16} color="inherit" /> : <PlayArrowRounded />}
              onClick={handleRunEvaluation}
              disabled={isEvaluating}
              sx={{ fontWeight: 600 }}
            >
              {isEvaluating ? 'Evaluating...' : 'Run Evaluation Now'}
            </Button>
          )}
        </Box>
      </Box>

      {/* Grid of Rule Cards */}
      <Grid container spacing={2.5}>
        {settings.map((setting) => {
          const typeMeta = NOTIFICATION_TYPE_CONFIG[setting.type] || {
            label: setting.typeName,
            color: '#6366F1',
            iconName: 'system',
          };

          return (
            <Grid size={{ xs: 12, md: 6 }} key={setting.id || setting.type}>
              <Card
                elevation={0}
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: 2.5,
                  border: '1px solid',
                  borderColor: setting.isMuted
                    ? isDark
                      ? 'rgba(255, 255, 255, 0.08)'
                      : 'rgba(0, 0, 0, 0.08)'
                    : isDark
                    ? 'rgba(99, 102, 241, 0.3)'
                    : 'rgba(99, 102, 241, 0.2)',
                  backgroundColor: setting.isMuted
                    ? isDark
                      ? 'rgba(0, 0, 0, 0.15)'
                      : 'rgba(0, 0, 0, 0.02)'
                    : isDark
                    ? theme.palette.background.paper
                    : '#ffffff',
                  opacity: setting.isMuted ? 0.75 : 1,
                  transition: 'all 0.2s ease',
                }}
              >
                <CardContent sx={{ p: 2.5, flex: 1, display: 'flex', flexDirection: 'column' }}>
                  {/* Card Top: Type & Status */}
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        sx={{
                          width: 10,
                          height: 10,
                          borderRadius: '50%',
                          backgroundColor: typeMeta.color,
                        }}
                      />
                      <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.05rem' }}>
                        {setting.typeName}
                      </Typography>
                    </Box>

                    {/* Mute Switch */}
                    {canMute && (
                      <FormControlLabel
                        control={
                          <Switch
                            size="small"
                            checked={!setting.isMuted}
                            onChange={() => handleToggleMute(setting)}
                            color="primary"
                          />
                        }
                        label={
                          <Typography variant="caption" sx={{ fontWeight: 600, color: setting.isMuted ? 'error.main' : 'success.main' }}>
                            {setting.isMuted ? 'Muted' : 'Active'}
                          </Typography>
                        }
                        sx={{ m: 0 }}
                      />
                    )}
                  </Box>

                  {/* Description */}
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2, flex: 1 }}>
                    {setting.description}
                  </Typography>

                  <Divider sx={{ my: 1.5 }} />

                  {/* Settings detail pills */}
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mb: 2 }}>
                    {setting.type === NotificationType.SystemAnnouncement ? (
                      <Chip
                        size="small"
                        icon={<AccessTimeRounded />}
                        label="Trigger: Real-Time Anomaly"
                        variant="outlined"
                        color="info"
                        sx={{ fontWeight: 600 }}
                      />
                    ) : setting.type === NotificationType.EventUpcoming ? (
                      <Chip
                        size="small"
                        icon={<AccessTimeRounded />}
                        label="Trigger: Per-Event Schedule"
                        variant="outlined"
                        color="info"
                        sx={{ fontWeight: 600 }}
                      />
                    ) : (
                      <Chip
                        size="small"
                        icon={<AccessTimeRounded />}
                        label={`Threshold: ${setting.reminderDays} days ahead`}
                        variant="outlined"
                        sx={{ fontWeight: 600 }}
                      />
                    )}

                    {setting.type === NotificationType.EventUpcoming ? (
                      <Chip
                        size="small"
                        icon={<NotificationsActiveRounded />}
                        label="Delivery: Configured Per Event"
                        variant="outlined"
                        color="primary"
                        sx={{ fontWeight: 600 }}
                      />
                    ) : (
                      <Chip
                        size="small"
                        icon={
                          setting.deliveryChannel === NotificationDeliveryChannel.SystemAndMail ? (
                            <EmailRounded sx={{ color: 'primary.main' }} />
                          ) : (
                            <NotificationsActiveRounded />
                          )
                        }
                        label={
                          setting.deliveryChannel === NotificationDeliveryChannel.SystemAndMail
                            ? 'In-App + Email'
                            : 'In-App Only'
                        }
                        variant="outlined"
                        color={
                          setting.deliveryChannel === NotificationDeliveryChannel.SystemAndMail
                            ? 'primary'
                            : 'default'
                        }
                        sx={{ fontWeight: 600 }}
                      />
                    )}
                  </Box>

                  {/* Target Audience & Required Permissions */}
                  <Box
                    sx={{
                      p: 1.25,
                      borderRadius: 1.5,
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)',
                      mb: 2,
                    }}
                  >
                    <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 0.5, color: 'text.secondary' }}>
                      Target Audience (Role Permissions):
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                      {setting.requiredPermissions && setting.requiredPermissions.length > 0 ? (
                        setting.requiredPermissions.map((perm) => (
                          <Chip
                            key={perm}
                            size="small"
                            label={perm}
                            variant="filled"
                            color="info"
                            sx={{ height: 22, fontSize: '0.72rem', fontWeight: 600 }}
                          />
                        ))
                      ) : (
                        <Chip
                          size="small"
                          label="All Organization Users"
                          variant="outlined"
                          sx={{ height: 22, fontSize: '0.72rem', fontWeight: 500 }}
                        />
                      )}
                    </Box>
                  </Box>

                  {/* Card bottom actions */}
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 'auto' }}>
                    <Typography variant="caption" color="text.secondary">
                      Updated: {new Date(setting.updatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </Typography>

                    {canAdjustThresholds && (
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<EditRounded />}
                        onClick={() => handleOpenEdit(setting)}
                        sx={{ fontWeight: 600 }}
                      >
                        Adjust Rule
                      </Button>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Edit Modal */}
      <NotificationSettingsModal
        open={modalOpen}
        setting={selectedSetting}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveModal}
      />
    </Box>
  );
};
