// src/core/store/api/baseApi.ts
/**
 * Base API Configuration with RTK Query
 * Centralized API setup with authentication, error handling, and caching
 */
import {
  createApi,
  // BaseQueryFn,
  // FetchArgs,
  // fetchBaseQuery,
  // FetchBaseQueryError
} from "@reduxjs/toolkit/query/react";
import {
  API_CONFIG,
  // API_WELCOME_CONFIG
} from "@/core/config/api";
// import { createBaseQueryWithAuth } from "@/core/store/api/baseQueryFactory";
import { createHybridBaseQuery } from "@/core/store/api/hybridBaseQuery";
// import {
//   // logout,
//   setSessionTimeout
// } from "@/core/store/slices/authSlice";
// import { APP_CONFIG } from "@/core/utils/constants";
// import { TokenManager } from "@/core/utils/tokenManager";
// import type { RootState } from "@/core/store/index";

const commonTagTypes = [
  "User",
  "UserGroup",
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
];

// v1.0 - Initial version with simple baseQuery
// // Enhanced base query with token management and error handling
// const baseQueryWithAuth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (args, api, extraOptions) => {
//   const baseQuery = fetchBaseQuery({
//     // baseUrl: APP_CONFIG.API_BASE_URL,
//     baseUrl: API_CONFIG.BASE_URL,
//     credentials: "include", // Include cookies for authentication if needed
//     mode: "cors", // Explicitly enable CORS
//     prepareHeaders: (headers, { getState }) => {
//       const state = getState() as RootState;
//       const token = state.auth.token || TokenManager.getToken();
//       if (token) {
//         headers.set("Authorization", `Bearer ${token}`);
//       }
//       headers.set("Accept", "application/json");
//       // headers.set("Content-Type", "application/json"); comment out because can't set file
//       headers.set("X-Requested-With", "XMLHttpRequest");
//       return headers;
//     },
//   });
//   const result = await baseQuery(args, api, extraOptions);
//   // Enhanced error handling with CORS-specific messages
//   if (result.error) {
//     if (APP_CONFIG.ENV === "local") {
//       console.error("🚀 ~ baseQueryWithAuth ~ result.error:", result.error, "API Error");
//     }
//     // Handle CORS-specific errors
//     if (result.error.status === "FETCH_ERROR") {
//       if (APP_CONFIG.ENV === "local") {
//         console.error("🚀 ~ baseQueryWithAuth ~ result.error.status:", result.error.status, "CORS Error detected. Check server configuration or use proxy.");
//       }
//     }
//   }
//   // Handle token expiration and refresh
//   // if (result.error && result.error.status === 401) {
//   //   const refreshToken = TokenManager.getRefreshToken();
//   //   if (refreshToken) {
//   //     try {
//   //       // Attempt to refresh token
//   //       const refreshResult = await baseQuery({
//   //         body: { refreshToken },
//   //         method: "POST",
//   //         url: "/auth/refresh"
//   //       }, api, extraOptions);
//   //       if (refreshResult.data) {
//   //         const { token: newToken, refreshToken: newRefreshToken } = refreshResult.data as {
//   //           token: string;
//   //           refreshToken: string;
//   //         };
//   //         // Store new tokens
//   //         TokenManager.setTokens(newToken, newRefreshToken);
//   //         // Retry original request with new token
//   //         result = await baseQuery(args, api, extraOptions);
//   //       }
//   //       else {
//   //         // Refresh failed, logout user
//   //         api.dispatch(logout());
//   //         TokenManager.clearTokens();
//   //       }
//   //     }
//   //     catch (error) {
//   //       console.error("🚀 ~ baseQueryWithAuth ~ error:", error, "Token refresh failed");
//   //       api.dispatch(logout());
//   //       TokenManager.clearTokens();
//   //     }
//   //   }
//   //   else {
//   //     // No refresh token, logout user
//   //     api.dispatch(logout());
//   //     TokenManager.clearTokens();
//   //   }
//   // }
//   // Handle session timeout warnings
//   if (result.meta?.response?.headers.get("X-Session-Timeout")) {
//     const timeoutTime = parseInt(result.meta.response.headers.get("X-Session-Timeout") || "0");
//     api.dispatch(setSessionTimeout(timeoutTime));
//   }
//   return result;
// };

// Ford's - Enhanced base query with token management and error handling
// const baseWelcomeQueryWithAuth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (args, api, extraOptions) => {
//   const baseQuery = fetchBaseQuery({
//     // baseUrl: APP_CONFIG.API_BASE_URL,
//     baseUrl: API_WELCOME_CONFIG.BASE_URL,
//     credentials: "include", // Include cookies for authentication if needed
//     mode: "cors", // Explicitly enable CORS
//     prepareHeaders: (headers, { getState }) => {
//       const state = getState() as RootState;
//       const token = state.auth.token || TokenManager.getToken();
//       if (token) {
//         headers.set("Authorization", `Bearer ${token}`);
//       }
//       headers.set("Accept", "application/json");
//       // headers.set("Content-Type", "application/json"); comment out because can't set file
//       headers.set("X-Requested-With", "XMLHttpRequest");
//       return headers;
//     },
//   });
//   const result = await baseQuery(args, api, extraOptions);
//   // Enhanced error handling with CORS-specific messages
//   if (result.error) {
//     if (APP_CONFIG.ENV === "local") {
//       console.error("🚀 ~ baseQueryWithAuth ~ result.error:", result.error, "API Error");
//     }
//     // Handle CORS-specific errors
//     if (result.error.status === "FETCH_ERROR") {
//       if (APP_CONFIG.ENV === "local") {
//         console.error("🚀 ~ baseQueryWithAuth ~ result.error.status:", result.error.status, "CORS Error detected. Check server configuration or use proxy.");
//       }
//     }
//   }
//   // Handle session timeout warnings
//   if (result.meta?.response?.headers.get("X-Session-Timeout")) {
//     const timeoutTime = parseInt(result.meta.response.headers.get("X-Session-Timeout") || "0");
//     api.dispatch(setSessionTimeout(timeoutTime));
//   }
//   return result;
// };

// Base API slice
// v3.0 - Hybrid base query with auto-mapping and global switch
export const baseApi = createApi({
  reducerPath: "api",
  tagTypes: commonTagTypes,
  baseQuery: createHybridBaseQuery(
    API_CONFIG.BASE_URL,
    API_CONFIG.GRAPHQL_URL
  ),
  serializeQueryArgs: ({ endpointName, queryArgs }) => {
    return `${endpointName}-${JSON.stringify(queryArgs)}`;
  },
  endpoints: () => ({})
});

// v3.0 - Separate API slice for CRM with same baseQuery
export const baseApiCrm = createApi({
  reducerPath: "apiCrm",
  tagTypes: [
    ...commonTagTypes,
    "CustomerProduct",
    "Service",
    "Category",
  ],
  baseQuery: createHybridBaseQuery(
    API_CONFIG.BASE_URL_CRM,
    API_CONFIG.GRAPHQL_URL
  ),
  serializeQueryArgs: ({ endpointName, queryArgs }) => {
    return `${endpointName}-${JSON.stringify(queryArgs)}`;
  },
  endpoints: () => ({}),
});

// v2.0 - Just export the baseQuery for use in multiple API slices, no createApi here
// export const baseApi = createApi({
//   reducerPath: "api",
//   tagTypes: commonTagTypes,
//   baseQuery: createBaseQueryWithAuth(API_CONFIG.BASE_URL),
//   endpoints: () => ({})
// });

// v2.0 - Just export the baseQuery for use in multiple API slices, no createApi here
// export const baseApiCrm = createApi({
//   reducerPath: "apiCrm",
//   tagTypes: [
//     ...commonTagTypes,
//     "CustomerProduct",
//     "Service",
//     "Category"
//   ],
//   baseQuery: createBaseQueryWithAuth(API_CONFIG.BASE_URL_CRM),
//   endpoints: () => ({})
// });

// v1.0 - Initial version with simple baseQuery
// export const baseApiV1 = createApi({
//   reducerPath: "api",
//   tagTypes: [
//     "User",
//     "Ticket",
//     "Workflow",
//     "Form and Workflow",
//     "Notification",
//     "SOP",
//     "Dashboard",
//     "Analytics",
//     "File",
//     "Comment",
//     "Timeline",
//     "Cases",
//     "Dispatch",
//     "Customer",
//     "Area",
//     "Device Iot",
//     "Unit",
//     "Files",
//     "AppointmentType",
//     "ServiceType",
//     "Appointment",
//     "Product"
//   ],
//   baseQuery: baseQueryWithAuth,
//   endpoints: () => ({})
// });

// Ford's - API slice
export const baseWelcomeCrmApi = createApi({
  reducerPath: "welcomeApi",
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
    "Product",
    "CustomerProduct",
    "CustomerNote",
    "CustomerSocial",
    "CustomerContactDefault",
    "Service",
    "Category"
  ],
  // baseQuery: baseWelcomeQueryWithAuth,
  baseQuery: createHybridBaseQuery(
    API_CONFIG.BASE_URL_CRM,
    API_CONFIG.GRAPHQL_URL
  ),
  serializeQueryArgs: ({ endpointName, queryArgs }) => {
    return `${endpointName}-${JSON.stringify(queryArgs)}`;
  },
  endpoints: () => ({})
});
