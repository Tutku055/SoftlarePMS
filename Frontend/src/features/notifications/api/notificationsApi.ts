import { apiClient } from '../../../config/apiClient';
import type {
  UserNotificationDto,
  NotificationTypeSettingDto,
  NotificationSummaryDto,
  AdjustNotificationThresholdDto,
  ToggleNotificationMuteDto,
  NotificationFilterParams,
  PaginatedList,
  NotificationType,
} from '../types';

export const notificationsApi = {
  /**
   * Get personal paginated notifications with optional type and read status filters.
   */
  getMyNotifications: async (params?: NotificationFilterParams): Promise<PaginatedList<UserNotificationDto>> => {
    const response = await apiClient.get<PaginatedList<UserNotificationDto>>('/notifications', {
      params,
    });
    return response.data;
  },

  /**
   * Get unread notification count for the active user badge.
   */
  getUnreadCount: async (): Promise<NotificationSummaryDto> => {
    const response = await apiClient.get<NotificationSummaryDto>('/notifications/unread-count');
    return response.data;
  },

  /**
   * Toggle read/unread status for a single notification.
   */
  toggleReadStatus: async (id: string): Promise<UserNotificationDto> => {
    const response = await apiClient.patch<UserNotificationDto>(`/notifications/${id}/toggle-read`);
    return response.data;
  },

  /**
   * Mark a single notification as read.
   */
  markAsRead: async (id: string): Promise<void> => {
    await apiClient.patch(`/notifications/${id}/read`);
  },

  /**
   * Mark a single notification as unread.
   */
  markAsUnread: async (id: string): Promise<void> => {
    await apiClient.patch(`/notifications/${id}/unread`);
  },

  /**
   * Mark all unread notifications for current user as read.
   */
  markAllAsRead: async (): Promise<{ markedReadCount: number }> => {
    const response = await apiClient.patch<{ markedReadCount: number }>('/notifications/read-all');
    return response.data;
  },

  /**
   * Delete a notification from personal inbox.
   */
  deleteNotification: async (id: string): Promise<void> => {
    await apiClient.delete(`/notifications/${id}`);
  },

  /**
   * Get all configurable passive notification type settings.
   */
  getSettings: async (): Promise<NotificationTypeSettingDto[]> => {
    const response = await apiClient.get<NotificationTypeSettingDto[]>('/notifications/settings');
    return response.data;
  },

  /**
   * Adjust reminder threshold days and delivery channel for a notification type.
   */
  adjustThreshold: async (
    type: NotificationType,
    dto: AdjustNotificationThresholdDto
  ): Promise<NotificationTypeSettingDto> => {
    const response = await apiClient.put<NotificationTypeSettingDto>(
      `/notifications/settings/${type}/threshold`,
      dto
    );
    return response.data;
  },

  /**
   * Mute or unmute a passive notification type.
   */
  toggleMute: async (
    type: NotificationType,
    dto: ToggleNotificationMuteDto
  ): Promise<NotificationTypeSettingDto> => {
    const response = await apiClient.put<NotificationTypeSettingDto>(
      `/notifications/settings/${type}/mute`,
      dto
    );
    return response.data;
  },

  /**
   * Trigger passive notification evaluation on-demand.
   */
  evaluatePassiveNotifications: async (): Promise<Record<string, number>> => {
    const response = await apiClient.post<Record<string, number>>('/notifications/evaluate');
    return response.data;
  },
};
