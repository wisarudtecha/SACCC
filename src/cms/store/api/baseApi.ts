// /src/store/api/baseApi.ts
/**
 * Base API Configuration with RTK Query
 * Centralized API setup with authentication, error handling, and caching
 */

import { createApi, BaseQueryFn, FetchArgs, fetchBaseQuery, FetchBaseQueryError } from "@reduxjs/toolkit/query/react";
import { API_CONFIG } from "@/core/config/api";
import {
  // logout,
  setSessionTimeout
} from "@/core/store/slices/authSlice";
// import { APP_CONFIG } from "@/cms/utils/constants";
import { normalizeSessionDeadline } from "@/core/utils/sessionDeadline";
import { TokenManager } from "@/core/utils/tokenManager";
import type { RootState } from "@/core/store/index";

// Enhanced base query with token management and error handling
const baseQueryWithAuth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions
) => {
  const baseQuery = fetchBaseQuery({
    // baseUrl: APP_CONFIG.API_BASE_URL,
    baseUrl: API_CONFIG.BASE_URL,
    mode: "cors", // Explicitly enable CORS
    credentials: "include", // Include cookies for authentication if needed
    prepareHeaders: (headers, { getState }) => {
      const state = getState() as RootState;
      const token = state.auth.token || TokenManager.getToken();

      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }

      headers.set("Accept", "application/json");
      // headers.set("Content-Type", "application/json"); comment out because can't set file
      headers.set("X-Requested-With", "XMLHttpRequest");

      return headers;
    },
  });

  // let result = await baseQuery(args, api, extraOptions);
  const result = await baseQuery(args, api, extraOptions);
  // Enhanced error handling with CORS-specific messages
  if (result.error) {
    // console.error("API Error:", result.error);
    // Handle CORS-specific errors
    if (result.error.status === "FETCH_ERROR") {
      // console.error("CORS Error detected. Check server configuration or use proxy.");
    }
  }

  // Handle token expiration and refresh
  if (result.error && result.error.status === 401) {
    // const refreshToken = TokenManager.getRefreshToken();
    // if (refreshToken) {
    //   try {
    //     // Attempt to refresh token
    //     const refreshResult = await baseQuery(
    //       {
    //         url: "/auth/refresh",
    //         method: "POST",
    //         body: { refreshToken },
    //       },
    //       api,
    //       extraOptions
    //     );
    //     if (refreshResult.data) {
    //       const { token: newToken, refreshToken: newRefreshToken } = refreshResult.data as {
    //         token: string;
    //         refreshToken: string;
    //       };
    //       // Store new tokens
    //       TokenManager.setTokens(newToken, newRefreshToken);
    //       // Retry original request with new token
    //       result = await baseQuery(args, api, extraOptions);
    //     }
    //     else {
    //       // Refresh failed, logout user
    //       api.dispatch(logout());
    //       TokenManager.clearTokens();
    //     }
    //   }
    //   catch (error) {
    //     console.error("Token refresh failed:", error);
    //     api.dispatch(logout());
    //     TokenManager.clearTokens();
    //   }
    // }
    // else {
    //   // No refresh token, logout user
    //   api.dispatch(logout());
    //   TokenManager.clearTokens();
    // }
  }

  // Handle session timeout warnings. Normalized to an absolute epoch-ms deadline; see
  // normalizeSessionDeadline for the accepted encodings.
  const sessionDeadline = normalizeSessionDeadline(result.meta?.response?.headers.get("X-Session-Timeout"));
  if (sessionDeadline !== null) {
    api.dispatch(setSessionTimeout(sessionDeadline));
  }

  return result;
};

// Base API slice
export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithAuth,
  tagTypes: [
    "User",
    "Ticket",
    "Workflow",
    "Form and Workflow",
    "Notification",
    "SOP",
    "Dashboard",
    "Analytics",
    "File",
    "Comment",
    "Timeline",
    "Cases",
    "Dispatch",
    "Customer",
    "Area",
    "Device Iot",
    "Unit",
    "Files",
    "AppointmentType",
    "ServiceType",
    "Appointment",
    "Product"
  ],
  endpoints: () => ({}),
});
