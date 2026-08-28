// src/core/store/api/auditApi.ts
/**
 * Audit Log API Endpoints
 */
import { baseApi } from "@/core/store/api/baseApi";
import type { ApiResponse } from "@/core/types";
import type { AuditLog, RawAuditLog } from "@/core/types/audit";

export interface AuditLogParams {
  start?: number;
  length?: number;
}

// The API sends these fields as JSON strings; older/empty records send an object,
// an empty string, or "{}". Throws on malformed JSON - callers handle it.
const parseJsonField = (value: RawAuditLog["newData"]): Record<string, unknown> => {
  if (typeof value === 'string') {
    if (value === '' || value === '{}') {
      return {};
    }
    return JSON.parse(value) as Record<string, unknown>;
  }
  return value || {};
};

const processAuditLog = (log: RawAuditLog): AuditLog => {
  try {
    return {
      ...log,
      newData: parseJsonField(log.newData),
      oldData: parseJsonField(log.oldData),
      resData: parseJsonField(log.resData),
    };
  } catch (e) {
    console.warn('Failed to parse JSON for audit log:', log.id, e);
    return {
      ...log,
      newData: {},
      oldData: {},
      resData: {},
    };
  }
};

export const auditApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAuditLogs: builder.query<ApiResponse<AuditLog[]>, AuditLogParams>({
      query: (params) => ({
        url: "/audit_log",
        params,
      }),
      transformResponse: (response: ApiResponse<RawAuditLog[]>): ApiResponse<AuditLog[]> => {
        if (response.data && Array.isArray(response.data)) {
          return {
            ...response,
            data: response.data.map(processAuditLog),
          };
        }
        // Unparsed payloads can't be passed through as AuditLog[]; keep the
        // envelope (status/msg) and let callers fall back to an empty list.
        return {
          ...response,
          data: undefined,
        };
      },
      providesTags: ["Timeline"], // Audit logs often relate to Timeline tags
    }),
    getAuditLogsByUsername: builder.query<ApiResponse<AuditLog[]>, { username: string } & AuditLogParams>({
      query: ({
        username,
        // ...params
      }) => ({
        url: `/audit_log/${username}`,
        // params,
      }),
      transformResponse: (response: ApiResponse<RawAuditLog[]>): ApiResponse<AuditLog[]> => {
        if (response.data && Array.isArray(response.data)) {
          return {
            ...response,
            data: response.data.map(processAuditLog),
          };
        }
        // Unparsed payloads can't be passed through as AuditLog[]; keep the
        // envelope (status/msg) and let callers fall back to an empty list.
        return {
          ...response,
          data: undefined,
        };
      },
      providesTags: ["Timeline"],
    }),
  }),
  // Vite HMR re-runs this module without a full page reload, which calls injectEndpoints a
  // second time. Without this, RTK Query keeps the definitions registered by the previous
  // run and an edit to a `query` silently has no effect until the page is reloaded.
  overrideExisting: import.meta.env.DEV,
});

export const {
  useGetAuditLogsQuery,
  useGetAuditLogsByUsernameQuery,
  useLazyGetAuditLogsByUsernameQuery,
} = auditApi;
