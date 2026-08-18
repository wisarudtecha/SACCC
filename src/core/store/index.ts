// src/core/store/index.ts
/**
 * Core State Management Configuration
 * Redux Toolkit setup with RTK Query integration
 */
import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import { baseApi, baseApiCrm, baseWelcomeCrmApi } from "@/core/store/api/baseApi";
import { graphqlApi } from "@/core/store/api/graphqlApi";

// import APIs
// import "@/core/store/api/authApi";
// import "@/core/store/api/graphql/authGqlApi";
import "@/core/store/api/userApi";
import "@/core/store/api/notificationApi";
import "@/core/store/api/fileApi";

// Slices
import authSlice from "@/core/store/slices/authSlice";
import notificationSlice from "@/core/store/slices/notificationSlice";
import uiSlice from "@/core/store/slices/uiSlice";
import realtimeSlice from "@/core/store/slices/realtimeSlice";

export const store = configureStore({
  reducer: {
    // RTK Query API slice - CRITICAL: This must match the reducerPath in baseApi
    [baseApi.reducerPath]: baseApi.reducer,
    [baseApiCrm.reducerPath]: baseApiCrm.reducer,
    [baseWelcomeCrmApi.reducerPath]: baseWelcomeCrmApi.reducer,
    [graphqlApi.reducerPath]: graphqlApi.reducer,
    
    // Regular slices
    auth: authSlice,
    notifications: notificationSlice,
    realtime: realtimeSlice,
    ui: uiSlice,
    // Add other slices here
  },
  middleware: getDefaultMiddleware => getDefaultMiddleware({
    // devTools: process.env.NODE_ENV !== "production",
    devTools: import.meta.env.MODE !== "production",

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
  .concat(baseApi.middleware)
  .concat(baseApiCrm.middleware)
  .concat(baseWelcomeCrmApi.middleware)
  .concat(graphqlApi.middleware)
  // Add other middleware here
});

// Setup listeners for refetchOnFocus/refetchOnReconnect
setupListeners(store.dispatch);

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Export the store as default for easier importing
export default store;
