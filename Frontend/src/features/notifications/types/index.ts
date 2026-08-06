/**
 * Notification Types strictly matching Backend Domain enum (SoftPMS.Domain.Enums.NotificationType).
 */
export const NotificationType = {
  DocumentExpiry: 1,
  FinanceAlert: 2,
  SystemAnnouncement: 3,
  EventUpcoming: 4,
} as const;

export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType];

/**
 * Notification Delivery Channels strictly matching Backend Domain enum (SoftPMS.Domain.Enums.NotificationDeliveryChannel).
 */
export const NotificationDeliveryChannel = {
  System: 1,
  SystemAndMail: 2,
} as const;

export type NotificationDeliveryChannel =
  (typeof NotificationDeliveryChannel)[keyof typeof NotificationDeliveryChannel];

/**
 * Frontend dynamic urgency calculation statuses.
 */
export type NotificationUrgency = 'Critical' | 'High' | 'Moderate' | 'Low';

/**
 * User Notification DTO matching Backend Application DTO.
 */
export interface UserNotificationDto {
  id: string;
  userId: string;
  type: NotificationType;
  typeName: string;
  title: string;
  message: string;
  isRead: boolean;
  targetDate?: string | null;
  remainingDays?: number | null;
  entityReferenceId?: string | null;
  entityReferenceType?: string | null;
  payloadJson?: string | null;
  createdAt: string;
  readAt?: string | null;

  // Dynamically computed in frontend
  urgency?: NotificationUrgency;
}

/**
 * Notification Type Setting DTO matching Backend Application DTO.
 */
export interface NotificationTypeSettingDto {
  id: string;
  type: NotificationType;
  typeName: string;
  description: string;
  isMuted: boolean;
  reminderDays: number;
  deliveryChannel: NotificationDeliveryChannel;
  deliveryChannelName: string;
  supportedPlaceholders: string[];
  requiredPermissions: string[];
  updatedAt: string;
}

/**
 * Notification Summary / Badge Count DTO.
 */
export interface NotificationSummaryDto {
  unreadCount: number;
  totalCount?: number;
}

/**
 * Request payload for adjusting threshold reminder days and delivery channel.
 */
export interface AdjustNotificationThresholdDto {
  reminderDays: number;
  deliveryChannel: NotificationDeliveryChannel;
}

/**
 * Request payload for muting or unmuting a notification type.
 */
export interface ToggleNotificationMuteDto {
  isMuted: boolean;
}

/**
 * Filter params for querying user notifications.
 */
export interface NotificationFilterParams {
  type?: NotificationType;
  isRead?: boolean;
  pageNumber?: number;
  pageSize?: number;
}

/**
 * Paginated list response wrapper from Backend.
 */
export interface PaginatedList<T> {
  items: T[];
  pageNumber: number;
  totalPages: number;
  totalCount: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}
