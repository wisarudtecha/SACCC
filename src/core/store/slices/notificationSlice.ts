// /src/store/slices/notificationSlice.ts
/**
 * Notification System State Slice
 * Handles notifications, preferences, and real-time updates
 */

import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { NotificationState, Notification, NotificationPreferences } from "@/cms/types";

const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
  preferences: {
    email: true,
    push: true,
    inApp: true,
    frequency: "immediate",
    channels: ["ticket_assigned", "ticket_updated"],
  },
  isLoading: false,
  error: null,
};

const notificationSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    // Loading states
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },

    // Error handling
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },

    clearError: (state) => {
      state.error = null;
    },

    // Notification management
    setNotifications: (state, action: PayloadAction<Notification[]>) => {
      state.notifications = action.payload;
      state.unreadCount = action.payload.filter(notification => !notification.isRead).length;
    },

    addNotification: (state, action: PayloadAction<Notification>) => {
      state.notifications?.unshift(action.payload);
      if (!action.payload.isRead) {
        state.unreadCount = (state.unreadCount || 0) + 1;
      }
    },

    updateNotification: (state, action: PayloadAction<{ id: string; updates: Partial<Notification> }>) => {
      const { id, updates } = action.payload;
      const notificationIndex = state.notifications?.findIndex(notification => notification.id === id) || 0;
      
      if (notificationIndex !== -1) {
        const wasUnread = !state.notifications?.[notificationIndex]?.isRead;
        state.notifications![notificationIndex] = { ...state.notifications![notificationIndex], ...updates };
        
        // Update unread count if read status changed
        if (wasUnread && updates.isRead === true) {
          state.unreadCount = Math.max(0, (state.unreadCount || 0) - 1);
        } else if (!wasUnread && updates.isRead === false) {
          state.unreadCount = (state.unreadCount || 0) + 1;
        }
      }
    },

    removeNotification: (state, action: PayloadAction<string>) => {
      const notificationId = action.payload;
      const notificationIndex = state.notifications?.findIndex(notification => notification.id === notificationId) || 0;
      
      if (notificationIndex !== -1) {
        const wasUnread = !state.notifications?.[notificationIndex]?.isRead;
        state.notifications?.splice(notificationIndex, 1);
        
        if (wasUnread) {
          state.unreadCount = Math.max(0, (state.unreadCount || 0) - 1);
        }
      }
    },

    // Bulk operations
    markAsRead: (state, action: PayloadAction<string>) => {
      const notificationId = action.payload;
      const notification = state.notifications?.find(n => n.id === notificationId);
      
      if (notification && !notification.isRead) {
        notification.isRead = true;
        state.unreadCount = Math.max(0, (state.unreadCount || 0) - 1);
      }
    },

    markAllAsRead: (state) => {
      state.notifications?.forEach(notification => {
        notification.isRead = true;
      });
      state.unreadCount = 0;
    },

    clearAllNotifications: (state) => {
      state.notifications = [];
      state.unreadCount = 0;
    },

    // Unread count management
    setUnreadCount: (state, action: PayloadAction<number>) => {
      state.unreadCount = action.payload;
    },

    incrementUnreadCount: (state) => {
      state.unreadCount = (state.unreadCount || 0) + 1;
    },

    decrementUnreadCount: (state) => {
      state.unreadCount = Math.max(0, (state.unreadCount || 0) - 1);
    },

    // Preferences
    setPreferences: (state, action: PayloadAction<NotificationPreferences>) => {
      state.preferences = action.payload;
    },

    updatePreferences: (state, action: PayloadAction<Partial<NotificationPreferences>>) => {
      state.preferences = { ...state.preferences, ...action.payload } as NotificationPreferences;
    },

    // Real-time notification handling
    handleRealtimeNotification: (state, action: PayloadAction<Notification>) => {
      const notification = action.payload;
      
      // Check if notification already exists
      const exists = state.notifications?.some(n => n.id === notification.id);
      
      if (!exists) {
        state.notifications?.unshift(notification);
        if (!notification.isRead) {
          state.unreadCount = (state.unreadCount || 0) + 1;
        }
      }
    },

    // Reset state
    resetNotificationState: (state) => {
      console.log(state);
      return { ...initialState };
    },
  },
});

export const {
  setLoading,
  setError,
  clearError,
  setNotifications,
  addNotification,
  updateNotification,
  removeNotification,
  markAsRead,
  markAllAsRead,
  clearAllNotifications,
  setUnreadCount,
  incrementUnreadCount,
  decrementUnreadCount,
  setPreferences,
  updatePreferences,
  handleRealtimeNotification,
  resetNotificationState,
} = notificationSlice.actions;

export default notificationSlice.reducer;
