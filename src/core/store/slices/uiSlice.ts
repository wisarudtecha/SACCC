// /src/store/slices/uiSlice.ts
/**
 * UI State Management Slice
 * Handles global UI state, theme, modals, loading states
 */

import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type {
  UIState,
  ToastMessage,
  // NotificationType
} from "@/cms/types";

const initialState: UIState = {
  sidebarCollapsed: false,
  theme: "light",
  language: "en",
  loading: {},
  modals: {},
  toasts: [],
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    // Sidebar
    toggleSidebar: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },

    setSidebarCollapsed: (state, action: PayloadAction<boolean>) => {
      state.sidebarCollapsed = action.payload;
    },

    // Theme management
    setTheme: (state, action: PayloadAction<"light" | "dark" | "auto">) => {
      state.theme = action.payload;
    },

    toggleTheme: (state) => {
      state.theme = state.theme === "light" ? "dark" : "light";
    },

    // Language
    setLanguage: (state, action: PayloadAction<"en" | "th" | "zh">) => {
      state.language = action.payload;
    },

    // Loading states
    setLoading: (state, action: PayloadAction<{ key: string; loading: boolean }>) => {
      const { key, loading } = action.payload;
      if (loading) {
        state.loading[key] = true;
      } else {
        delete state.loading[key];
      }
    },

    clearLoading: (state, action: PayloadAction<string>) => {
      const key = action.payload;
      delete state.loading[key];
    },

    clearAllLoading: (state) => {
      state.loading = {};
    },

    // Modal management
    openModal: (state, action: PayloadAction<string>) => {
      const modalId = action.payload;
      state.modals[modalId] = true;
    },

    closeModal: (state, action: PayloadAction<string>) => {
      const modalId = action.payload;
      delete state.modals[modalId];
    },

    closeAllModals: (state) => {
      state.modals = {};
    },

    toggleModal: (state, action: PayloadAction<string>) => {
      const modalId = action.payload;
      state.modals[modalId] = !state.modals[modalId];
    },

    // Toast notifications
    addToast: (state, action: PayloadAction<Omit<ToastMessage, "id">>) => {
      const toast: ToastMessage = {
        id: Date.now().toString() + Math.random().toString(36),
        ...action.payload,
      };
      state.toasts.push(toast);
    },

    removeToast: (state, action: PayloadAction<string>) => {
      const toastId = action.payload;
      state.toasts = state.toasts.filter(toast => toast.id !== toastId);
    },

    clearAllToasts: (state) => {
      state.toasts = [];
    },

    // Toast convenience methods
    showSuccessToast: (state, action: PayloadAction<{ title: string; message: string }>) => {
      const toast: ToastMessage = {
        id: Date.now().toString() + Math.random().toString(36),
        type: "success",
        title: action.payload.title,
        message: action.payload.message,
        duration: 5000,
      };
      state.toasts.push(toast);
    },

    showErrorToast: (state, action: PayloadAction<{ title: string; message: string }>) => {
      const toast: ToastMessage = {
        id: Date.now().toString() + Math.random().toString(36),
        type: "error",
        title: action.payload.title,
        message: action.payload.message,
        duration: 8000,
      };
      state.toasts.push(toast);
    },

    showWarningToast: (state, action: PayloadAction<{ title: string; message: string }>) => {
      const toast: ToastMessage = {
        id: Date.now().toString() + Math.random().toString(36),
        type: "warning",
        title: action.payload.title,
        message: action.payload.message,
        duration: 6000,
      };
      state.toasts.push(toast);
    },

    showInfoToast: (state, action: PayloadAction<{ title: string; message: string }>) => {
      const toast: ToastMessage = {
        id: Date.now().toString() + Math.random().toString(36),
        type: "info",
        title: action.payload.title,
        message: action.payload.message,
        duration: 5000,
      };
      state.toasts.push(toast);
    },

    // Reset state
    resetUIState: (state) => {
      console.log(state);
      return { ...initialState };
    },
  },
});

export const {
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
  resetUIState,
} = uiSlice.actions;

export default uiSlice.reducer;
