// /src/store/slices/authSlice.ts
/**
 * Authentication State Management
 */

import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { AuthState, User } from "@/cms/types";

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  sessionTimeout: null,
  failedAttempts: 0,
  isLocked: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    loginStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    loginSuccess: (state, action: PayloadAction<{ user: User; token: string }>) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      state.isLoading = false;
      state.error = null;
      state.failedAttempts = 0;
      state.isLocked = false;
    },
    loginFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
      state.failedAttempts += 1;
      state.isLocked = state.failedAttempts >= 3;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
      state.sessionTimeout = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    setSessionTimeout: (state, action: PayloadAction<number>) => {
      state.sessionTimeout = action.payload;
    },
    resetFailedAttempts: (state) => {
      state.failedAttempts = 0;
      state.isLocked = false;
    },
  },
});

export const {
  loginStart,
  loginSuccess,
  loginFailure,
  logout,
  clearError,
  setSessionTimeout,
  resetFailedAttempts,
} = authSlice.actions;

export default authSlice.reducer;
