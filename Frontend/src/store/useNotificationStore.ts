import { create } from 'zustand';
import { notificationsApi } from '../features/notifications/api/notificationsApi';

interface NotificationState {
  unreadCount: number;
  totalCount: number;
  isLoadingUnread: boolean;
  fetchUnreadCount: () => Promise<void>;
  setUnreadCount: (count: number) => void;
  setCounts: (unread: number, total: number) => void;
  decrementUnreadCount: (amount?: number) => void;
  incrementUnreadCount: (amount?: number) => void;
  decrementTotalCount: (amount?: number) => void;
}

export const useNotificationStore = create<NotificationState>()((set) => ({
  unreadCount: 0,
  totalCount: 0,
  isLoadingUnread: false,

  fetchUnreadCount: async () => {
    try {
      const res = await notificationsApi.getUnreadCount();
      set({ unreadCount: res.unreadCount, totalCount: res.totalCount });
    } catch {
      // silently ignore — badge retains last known value
    }
  },

  setUnreadCount: (count: number) => set({ unreadCount: Math.max(0, count) }),

  setCounts: (unread: number, total: number) =>
    set({ unreadCount: Math.max(0, unread), totalCount: Math.max(0, total) }),

  decrementUnreadCount: (amount: number = 1) =>
    set((state) => ({ unreadCount: Math.max(0, state.unreadCount - amount) })),

  incrementUnreadCount: (amount: number = 1) =>
    set((state) => ({ unreadCount: state.unreadCount + amount })),

  decrementTotalCount: (amount: number = 1) =>
    set((state) => ({ totalCount: Math.max(0, state.totalCount - amount) })),
}));
