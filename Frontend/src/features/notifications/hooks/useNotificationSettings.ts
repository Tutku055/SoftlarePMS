import { useState, useEffect, useCallback } from 'react';
import { notificationsApi } from '../api/notificationsApi';
import type {
  NotificationTypeSettingDto,
  NotificationType,
  NotificationDeliveryChannel,
} from '../types';

export function useNotificationSettings() {
  const [settings, setSettings] = useState<NotificationTypeSettingDto[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [evaluationResult, setEvaluationResult] = useState<Record<string, number> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await notificationsApi.getSettings();
      setSettings(data);
    } catch (err: any) {
      console.error('Failed to fetch notification settings', err);
      setError(err?.response?.data?.message || 'Failed to load notification settings.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const adjustThreshold = async (
    type: NotificationType,
    reminderDays: number,
    deliveryChannel: NotificationDeliveryChannel
  ) => {
    setIsSaving(true);
    setError(null);
    try {
      const updated = await notificationsApi.adjustThreshold(type, {
        reminderDays,
        deliveryChannel,
      });
      setSettings((prev) => prev.map((s) => (s.type === type ? updated : s)));
      return updated;
    } catch (err: any) {
      console.error('Failed to adjust threshold', err);
      const msg = err?.response?.data?.message || 'Failed to save threshold settings.';
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleMute = async (type: NotificationType, isMuted: boolean) => {
    setIsSaving(true);
    setError(null);
    try {
      const updated = await notificationsApi.toggleMute(type, { isMuted });
      setSettings((prev) => prev.map((s) => (s.type === type ? updated : s)));
      return updated;
    } catch (err: any) {
      console.error('Failed to toggle mute', err);
      const msg = err?.response?.data?.message || 'Failed to update mute state.';
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const triggerEvaluation = async () => {
    setIsEvaluating(true);
    setError(null);
    try {
      const res = await notificationsApi.evaluatePassiveNotifications();
      setEvaluationResult(res);
      return res;
    } catch (err: any) {
      console.error('Failed to run passive notification evaluation', err);
      const msg = err?.response?.data?.message || 'Failed to trigger evaluation.';
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsEvaluating(false);
    }
  };

  return {
    settings,
    isLoading,
    isSaving,
    isEvaluating,
    evaluationResult,
    error,
    refetch: fetchSettings,
    adjustThreshold,
    toggleMute,
    triggerEvaluation,
    clearEvaluationResult: () => setEvaluationResult(null),
  };
}
