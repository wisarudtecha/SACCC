// /src/store/slices/index.ts
/**
 * Centralized slice exports
 * Makes importing slices cleaner across the application
 */

export { default as authSlice } from "@/core/store/slices/authSlice";
export { default as ticketSlice } from "@/cms/store/slices/ticketSlice";
export { default as workflowSlice } from "@/cms/store/slices/workflowSlice";
export { default as notificationSlice } from "@/core/store/slices/notificationSlice";
export { default as uiSlice } from "@/core/store/slices/uiSlice";
export { default as realtimeSlice } from "@/core/store/slices/realtimeSlice";

// Export all actions for convenience
export {
  loginStart,
  loginSuccess,
  loginFailure,
  logout,
  clearError as authClearError,
  setSessionTimeout,
  resetFailedAttempts
} from "@/core/store/slices/authSlice";
export {
  setLoading as ticketSetLoading,
  setError as ticketSetError,
  clearError as ticketClearError,
  setTickets,
  addTicket,
  updateTicket,
  removeTicket,
  setCurrentTicket,
  setPagination,
  addFilter,
  removeFilter,
  clearFilters,
  setFilters,
  // selectTicket,
  deselectTicket,
  // selectAllTickets,
  clearSelection,
  toggleTicketSelection,
  // updateMultipleTickets,
  resetTicketState
} from "@/cms/store/slices/ticketSlice";
export {
  setLoading as workflowSetLoading,
  setError as workflowSetError,
  clearError as workflowClearError,
  setWorkflows,
  addWorkflow,
  updateWorkflow,
  removeWorkflow,
  setCurrentWorkflow,
  openDesigner,
  closeDesigner,
  // addWorkflowStep,
  // updateWorkflowStep,
  // removeWorkflowStep,
  // reorderWorkflowSteps,
  setTemplates,
  addTemplate,
  resetWorkflowState
} from "@/cms/store/slices/workflowSlice";
export {
  setLoading as notificationSetLoading,
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
  resetNotificationState
} from "@/core/store/slices/notificationSlice";
export {
  toggleSidebar,
  setSidebarCollapsed,
  setTheme,
  toggleTheme,
  setLanguage,
  setLoading,
  clearLoading,
  clearAllLoading,
  openModal,
  closeModal,
  closeAllModals,
  toggleModal,
  addToast,
  removeToast,
  clearAllToasts,
  showSuccessToast,
  showErrorToast,
  showWarningToast,
  showInfoToast,
  resetUIState
} from "@/core/store/slices/uiSlice";
export {
  setConnected,
  updateLastPing,
  connectionLost,
  setActiveUsers,
  addActiveUser,
  removeActiveUser,
  updateActiveUser,
  addEvent,
  clearEvents,
  removeEvent,
  handleTicketUpdate,
  handleNewComment,
  handleWorkflowEvent,
  handleUserStatusChange,
  handleGenericEvent,
  updateConnectionStats,
  resetRealtimeState,
  cleanupOldEvents
} from "@/core/store/slices/realtimeSlice";

// /src/hooks/useTypedSelector.ts
/**
 * Enhanced typed selector hooks
 * Provides convenient access to slice states
 */

import { useAppSelector } from "@/core/hooks/redux";
import type { RootState } from "@/core/store/index";

// Auth selectors
export const useAuth = () => useAppSelector((state: RootState) => state.auth);
export const useUser = () => useAppSelector((state: RootState) => state.auth.user);
export const useIsAuthenticated = () => useAppSelector((state: RootState) => state.auth.isAuthenticated);

// Ticket selectors
// export const useTickets = () => useAppSelector((state: RootState) => state.tickets);
// export const useCurrentTicket = () => useAppSelector((state: RootState) => state.tickets.currentTicket);
// export const useSelectedTickets = () => useAppSelector((state: RootState) => state.tickets.selectedTickets);

// Workflow selectors
// export const useWorkflows = () => useAppSelector((state: RootState) => state.workflows);
// export const useCurrentWorkflow = () => useAppSelector((state: RootState) => state.workflows.currentWorkflow);
// export const useIsDesignerOpen = () => useAppSelector((state: RootState) => state.workflows.isDesignerOpen);

// Notification selectors
// export const useNotifications = () => useAppSelector((state: RootState) => state.notifications);
// export const useUnreadCount = () => useAppSelector((state: RootState) => state.notifications.unreadCount);

// UI selectors
export const useUI = () => useAppSelector((state: RootState) => state.ui);
export const useTheme = () => useAppSelector((state: RootState) => state.ui.theme);
export const useLanguage = () => useAppSelector((state: RootState) => state.ui.language);
export const useSidebarCollapsed = () => useAppSelector((state: RootState) => state.ui.sidebarCollapsed);
export const useToasts = () => useAppSelector((state: RootState) => state.ui.toasts);

// Realtime selectors
// export const useRealtime = () => useAppSelector((state: RootState) => state.realtime);
// export const useIsConnected = () => useAppSelector((state: RootState) => state.realtime.connected);
// export const useActiveUsers = () => useAppSelector((state: RootState) => state.realtime.activeUsers);

// Composite selectors
export const useLoadingStates = () => useAppSelector((state: RootState) => ({
  auth: state.auth.isLoading,
  // tickets: state.tickets.isLoading,
  // workflows: state.workflows.isLoading,
  // notifications: state.notifications.isLoading,
}));

export const useErrorStates = () => useAppSelector((state: RootState) => ({
  auth: state.auth.error,
  // tickets: state.tickets.error,
  // workflows: state.workflows.error,
  // notifications: state.notifications.error,
  ui: state.ui.toasts.filter(toast => toast.type === "error"),
}));
