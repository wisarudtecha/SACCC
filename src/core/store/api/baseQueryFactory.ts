// src/core/store/api/baseQueryFactory.ts
import { BaseQueryFn, FetchArgs, fetchBaseQuery, FetchBaseQueryError } from "@reduxjs/toolkit/query/react";
import { setSessionTimeout } from "@/core/store/slices/authSlice";
import { normalizeSessionDeadline } from "@/core/utils/sessionDeadline";
import { TokenManager } from "@/core/utils/tokenManager";
import type { RootState } from "@/core/store";

/**
 * Factory function for creating baseQuery with shared logic
 */
export const createBaseQueryWithAuth = (baseUrl: string): BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> => {
  const rawBaseQuery = fetchBaseQuery({
    baseUrl,
    credentials: "include",
    mode: "cors",
    prepareHeaders: (headers, { getState }) => {
      const state = getState() as RootState;
      const token = state.auth.token || TokenManager.getToken();

      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }

      headers.set("Accept", "application/json");
      headers.set("X-Requested-With", "XMLHttpRequest");

      return headers;
    }
  });

  const baseQueryWithAuth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (args, api, extraOptions) => {
    const result = await rawBaseQuery(args, api, extraOptions);

    // CORS / Network error
    if (result.error?.status === "FETCH_ERROR") {
      console.error("CORS / Network error", result.error);
    }

    // Unauthorized
    if (result.error?.status === 401) {
      // Refresh token
    }

    // Session timeout header. Normalized to an absolute epoch-ms deadline so every reader
    // works in the same units regardless of what the BFF encodes; unparseable values are
    // dropped so the session falls back to the JWT `exp`.
    const sessionDeadline = normalizeSessionDeadline(result.meta?.response?.headers.get("X-Session-Timeout"));
    if (sessionDeadline !== null) {
      api.dispatch(setSessionTimeout(sessionDeadline));
    }

    return result;
  };
  
  return baseQueryWithAuth;
};
