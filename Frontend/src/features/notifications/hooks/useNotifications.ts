import { useState, useEffect, useCallback, useMemo } from 'react';
import { notificationsApi } from '../api/notificationsApi';
import { useNotificationStore } from '../../../store/useNotificationStore';
import type {
  UserNotificationDto,
  NotificationType,
  NotificationUrgency,
  NotificationFilterParams,
  NotificationTypeSettingDto,
} from '../types';
import { calculateNotificationUrgency, parseUtcDate } from '../utils/urgencyUtils';

export type NotificationStatusFilter = 'all' | 'unread' | 'read';
export type NotificationSortOption = 'date_desc' | 'date_asc' | 'urgency' | 'remaining_days' | 'type';

export function useNotifications() {
  const [items, setItems] = useState<UserNotificationDto[]>([]);
  const unreadCount = useNotificationStore((state) => state.unreadCount);
  const fetchGlobalUnread = useNotificationStore((state) => state.fetchUnreadCount);
  const decrementUnread = useNotificationStore((state) => state.decrementUnreadCount);
  const incrementUnread = useNotificationStore((state) => state.incrementUnreadCount);
  const setGlobalUnread = useNotificationStore((state) => state.setUnreadCount);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isActionLoading, setIsActionLoading] = useState<boolean>(false);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);

  // Filters
  const [selectedType, setSelectedType] = useState<NotificationType | 'all'>('all');
  const [selectedUrgency, setSelectedUrgency] = useState<NotificationUrgency | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<NotificationStatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<NotificationSortOption>('date_desc');

  // Settings map to compute dynamic threshold for urgency
  const [typeSettings, setTypeSettings] = useState<Map<NotificationType, number>>(new Map());

  // Load type settings once to know adjusted threshold days for each type
  const loadSettingsMap = useCallback(async () => {
    try {
      const settings = await notificationsApi.getSettings();
      const map = new Map<NotificationType, number>();
      settings.forEach((s: NotificationTypeSettingDto) => {
        map.set(s.type, s.reminderDays);
      });
      setTypeSettings(map);
    } catch {
      // If user lacks permission for settings, default fallbacks will be used
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: NotificationFilterParams = {
        pageNumber,
        pageSize,
      };

      if (selectedType !== 'all') {
        params.type = selectedType;
      }

      if (selectedStatus === 'unread') {
        params.isRead = false;
      } else if (selectedStatus === 'read') {
        params.isRead = true;
      }

      const res = await notificationsApi.getMyNotifications(params);
      
      setItems(res.items);
      setTotalPages(res.totalPages);
      setTotalCount(res.totalCount);
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    } finally {
      setIsLoading(false);
    }
  }, [pageNumber, pageSize, selectedType, selectedStatus]);

  useEffect(() => {
    loadSettingsMap();
    fetchGlobalUnread();
  }, [loadSettingsMap, fetchGlobalUnread]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Augment items with dynamic urgency calculation
  const enrichedItems = useMemo(() => {
    return items.map((item) => {
      const thresholdDays = typeSettings.get(item.type) ?? 30;
      const urgency = calculateNotificationUrgency(
        item.remainingDays,
        item.targetDate,
        thresholdDays
      );
      return {
        ...item,
        urgency,
      };
    });
  }, [items, typeSettings]);

  // Client-side filtering for search & urgency, plus client-side sorting
  const processedNotifications = useMemo(() => {
    let result = [...enrichedItems];

    // Status filter if viewing locally
    if (selectedStatus === 'unread') {
      result = result.filter((n) => !n.isRead);
    } else if (selectedStatus === 'read') {
      result = result.filter((n) => n.isRead);
    }

    // Search filter (title, message, typeName)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(
        (n) =>
          n.title.toLowerCase().includes(query) ||
          n.message.toLowerCase().includes(query) ||
          n.typeName.toLowerCase().includes(query)
      );
    }

    // Urgency filter
    if (selectedUrgency !== 'all') {
      result = result.filter((n) => n.urgency === selectedUrgency);
    }

    // Sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case 'date_asc':
          return parseUtcDate(a.createdAt).getTime() - parseUtcDate(b.createdAt).getTime();

        case 'urgency': {
          const urgencyOrder: Record<NotificationUrgency, number> = {
            Critical: 4,
            High: 3,
            Moderate: 2,
            Low: 1,
          };
          const urgencyA = urgencyOrder[a.urgency ?? 'Low'];
          const urgencyB = urgencyOrder[b.urgency ?? 'Low'];
          if (urgencyA !== urgencyB) {
            return urgencyB - urgencyA; // Most urgent first
          }
          return parseUtcDate(b.createdAt).getTime() - parseUtcDate(a.createdAt).getTime();
        }

        case 'remaining_days': {
          const daysA = a.remainingDays ?? 9999;
          const daysB = b.remainingDays ?? 9999;
          return daysA - daysB; // Smallest remaining days first
        }

        case 'type':
          return a.type - b.type;

        case 'date_desc':
        default:
          return parseUtcDate(b.createdAt).getTime() - parseUtcDate(a.createdAt).getTime();
      }
    });

    return result;
  }, [enrichedItems, selectedStatus, searchQuery, selectedUrgency, sortBy]);

  // Urgency stats for dashboard summary cards
  const stats = useMemo(() => {
    let critical = 0;
    let high = 0;
    let moderate = 0;
    let low = 0;

    enrichedItems.forEach((n) => {
      if (n.urgency === 'Critical') critical++;
      else if (n.urgency === 'High') high++;
      else if (n.urgency === 'Moderate') moderate++;
      else low++;
    });

    return {
      total: totalCount,
      unread: unreadCount,
      critical,
      high,
      moderate,
      low,
    };
  }, [enrichedItems, totalCount, unreadCount]);

  const toggleReadStatus = async (id: string) => {
    setIsActionLoading(true);
    try {
      const updated = await notificationsApi.toggleReadStatus(id);
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, isRead: updated.isRead, readAt: updated.readAt } : item))
      );
      if (updated.isRead) {
        decrementUnread(1);
      } else {
        incrementUnread(1);
      }
      return updated;
    } catch (err) {
      console.error('Failed to toggle notification read status', err);
      throw err;
    } finally {
      setIsActionLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    setIsActionLoading(true);
    try {
      await notificationsApi.markAsRead(id);
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, isRead: true, readAt: new Date().toISOString() } : item))
      );
      decrementUnread(1);
    } catch (err) {
      console.error('Failed to mark notification as read', err);
      throw err;
    } finally {
      setIsActionLoading(false);
    }
  };

  const markAsUnread = async (id: string) => {
    setIsActionLoading(true);
    try {
      await notificationsApi.markAsUnread(id);
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, isRead: false, readAt: undefined } : item))
      );
      incrementUnread(1);
    } catch (err) {
      console.error('Failed to mark notification as unread', err);
      throw err;
    } finally {
      setIsActionLoading(false);
    }
  };

  const markAllAsRead = async () => {
    setIsActionLoading(true);
    try {
      await notificationsApi.markAllAsRead();
      setItems((prev) => prev.map((item) => ({ ...item, isRead: true, readAt: new Date().toISOString() })));
      setGlobalUnread(0);
    } catch (err) {
      console.error('Failed to mark all notifications as read', err);
      throw err;
    } finally {
      setIsActionLoading(false);
    }
  };

  const deleteNotification = async (id: string) => {
    setIsActionLoading(true);
    try {
      await notificationsApi.deleteNotification(id);
      const target = items.find((i) => i.id === id);
      if (target && !target.isRead) {
        decrementUnread(1);
      }
      setItems((prev) => prev.filter((item) => item.id !== id));
      setTotalCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to delete notification', err);
      throw err;
    } finally {
      setIsActionLoading(false);
    }
  };

  return {
    notifications: processedNotifications,
    rawItems: items,
    unreadCount,
    isLoading,
    isActionLoading,
    pageNumber,
    pageSize,
    totalPages,
    totalCount,
    selectedType,
    selectedUrgency,
    selectedStatus,
    searchQuery,
    sortBy,
    stats,
    setPageNumber,
    setPageSize,
    setSelectedType,
    setSelectedUrgency,
    setSelectedStatus,
    setSearchQuery,
    setSortBy,
    toggleReadStatus,
    markAsRead,
    markAsUnread,
    markAllAsRead,
    deleteNotification,
    refetch: fetchNotifications,
    refetchUnreadCount: fetchGlobalUnread,
  };
}
