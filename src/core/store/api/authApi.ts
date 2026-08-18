// src/core/store/api/authApi.ts
/**
 * Authentication API Endpoints
 * Complete auth system with login, register, profile management
 */

import { baseApi } from "@/core/store/api/baseApi";
import type { 
  User,
  // LoginCredentials,
  // RegisterData,
  // ChangePasswordData,
  // ForgotPasswordData,
  // ResetPasswordData,
  UserPreferences,
  ApiResponse
} from "@/cms/types";
import type { LoginCredentials, RegisterData } from "@/core/types/auth";

export interface LoginResponse {
  accessToken(accessToken: string, refreshToken: string, expiresIn: number): unknown;
  user: User;
  token: string;
  refreshToken: string;
  expiresIn: number;
}

export interface ProfileUpdateData {
  name?: string;
  email?: string;
  avatar?: string;
  department?: string;
  preferences?: Partial<UserPreferences>;
}

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Authentication endpoints
    login: builder.mutation<LoginResponse, LoginCredentials>({
      query: (credentials) => ({
        url: `/auth/login?username=${credentials?.username || ""}&password=${credentials?.password || ""}&organization=${credentials?.organization || ""}`,
        method: "GET",
        // body: credentials,
      }),
      invalidatesTags: ["User"],
    }),

    register: builder.mutation<ApiResponse<User>, RegisterData>({
      query: (userData) => ({
        url: "/auth/register",
        method: "POST",
        body: userData,
      }),
    }),

    logout: builder.mutation<void, void>({
      query: () => ({
        url: "/auth/logout",
        method: "POST",
      }),
      invalidatesTags: ["User"],
    }),

    refreshToken: builder.mutation<LoginResponse, { refreshToken: string }>({
      query: (data) => ({
        url: "/auth/refresh",
        method: "POST",
        body: data,
      }),
    }),

    // forgotPassword: builder.mutation<ApiResponse<string>, ForgotPasswordData>({
    //   query: (data) => ({
    //     url: "/auth/forgot-password",
    //     method: "POST",
    //     body: data,
    //   }),
    // }),

    // resetPassword: builder.mutation<ApiResponse<string>, ResetPasswordData>({
    //   query: (data) => ({
    //     url: "/auth/reset-password",
    //     method: "POST",
    //     body: data,
    //   }),
    // }),

    // changePassword: builder.mutation<ApiResponse<string>, ChangePasswordData>({
    //   query: (data) => ({
    //     url: "/auth/change-password",
    //     method: "POST",
    //     body: data,
    //   }),
    // }),

    // Profile management
    getProfile: builder.query<User, void>({
      query: () => "/auth/profile",
      providesTags: ["User"],
    }),

    updateProfile: builder.mutation<ApiResponse<User>, ProfileUpdateData>({
      query: (data) => ({
        url: "/auth/profile",
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["User"],
    }),

    updatePreferences: builder.mutation<ApiResponse<UserPreferences>, Partial<UserPreferences>>({
      query: (preferences) => ({
        url: "/auth/preferences",
        method: "PUT",
        body: preferences,
      }),
      invalidatesTags: ["User"],
    }),

    // Security endpoints
    getSecurityLog: builder.query<ApiResponse<unknown[]>, { page?: number; limit?: number }>({
      query: ({ page = 1, limit = 20 }) => 
        `/auth/security-log?page=${page}&limit=${limit}`,
    }),

    enableTwoFactor: builder.mutation<ApiResponse<{ qrCode: string; secret: string }>, void>({
      query: () => ({
        url: "/auth/2fa/enable",
        method: "POST",
      }),
    }),

    verifyTwoFactor: builder.mutation<ApiResponse<string>, { token: string }>({
      query: (data) => ({
        url: "/auth/2fa/verify",
        method: "POST",
        body: data,
      }),
    }),

    disableTwoFactor: builder.mutation<ApiResponse<string>, { password: string }>({
      query: (data) => ({
        url: "/auth/2fa/disable",
        method: "POST",
        body: data,
      }),
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useLogoutMutation,
  useRefreshTokenMutation,
  // useForgotPasswordMutation,
  // useResetPasswordMutation,
  // useChangePasswordMutation,
  useGetProfileQuery,
  useUpdateProfileMutation,
  useUpdatePreferencesMutation,
  useGetSecurityLogQuery,
  useEnableTwoFactorMutation,
  useVerifyTwoFactorMutation,
  useDisableTwoFactorMutation,
} = authApi;
