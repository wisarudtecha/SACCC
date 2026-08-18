// src/cms/store/index.ts
/**
 * Core State Management Configuration
 * Redux Toolkit setup with RTK Query integration
 */

import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
// Import the base API
import { baseApi } from "@/core/store/api/baseApi";
import "@/cms/store/api/ticketApi";
import "@/cms/store/api/workflowApi";

// Import regular slices
import ticketSlice from "@/cms/store/slices/ticketSlice";
import workflowSlice from "@/cms/store/slices/workflowSlice";

export const store = configureStore({
  reducer: {
    // RTK Query API slice - CRITICAL: This must match the reducerPath in baseApi
    [baseApi.reducerPath]: baseApi.reducer,
    
    // Regular slices
    tickets: ticketSlice,
    workflows: workflowSlice
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types for serialization check
        ignoredActions: [
          "persist/PERSIST",
          "persist/REHYDRATE",
          "persist/REGISTER"
        ],
        // Ignore these field paths in all actions
        ignoredActionsPaths: ["meta.arg", "payload.timestamp"],
        // Ignore these paths in the state
        ignoredPaths: ["items.dates"],
      },
    })
    // CRITICAL: Add the RTK Query middleware - this was missing!
    .concat(baseApi.middleware),

  // devTools: process.env.NODE_ENV !== "production",
  devTools: import.meta.env.MODE !== "production",
});

// Setup listeners for refetchOnFocus/refetchOnReconnect
setupListeners(store.dispatch);

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Export the store as default for easier importing
export default store;
