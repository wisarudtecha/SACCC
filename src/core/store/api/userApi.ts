// src/core/store/api/userApi.ts
/**
 * User Management API Endpoints
 * Admin user management, roles, and permissions
 */

import { baseApi } from "@/core/store/api/baseApi";
import type { ApiResponse, User } from "@/cms/types";
import type {
  Permission,
  // PermissionCreateData,
  PermissionQueryParams,
  Role,
  RolePermission,
  RolePermissionQueryParams,
  RolePermissionsCreateData,
  RolePermissionsUpdateData,
  RolesPermissionsUpdateData,
  RoleCreateData,
  RoleUpdateData,
  RoleQueryParams,
} from "@/core/types/role";
import type {
  ChangePasswordData,
  ResetPasswordData,
  EnhancedSkill,
  SkillQueryParams,
  UserWithSkillsBatchUpdateData,
  // UserCreateData,
  UserArea,
  UserAreaUpdateData,
  UserGroup,
  UserGroupCreateData,
  UserGroupUpdateData,
  UserGroupMember,
  UserGroupWithMembers,
  AssignUserGroupData,
  AssignUserGroupBatchData,
  UserGroupQueryParams,
  UserSkill,
  UserProfile,
  UserQueryParams,
  UserUnitInfo,
  // UserUpdateData
} from "@/core/types/user";

// Single-record endpoints are typed as ApiResponse<T> and their consumers read `.data`.
// But the hybrid layer's normalizeToApiResponse (see gqlUtils.ts) unwraps a single REST
// record to the bare object, while a single GraphQL record stays enveloped. Re-wrap the
// unwrapped case so `.data` is always present regardless of VITE_USE_GRAPHQL / REST fallback.
const ensureEnvelope = <T>(response: unknown): ApiResponse<T> => {
  if (response && typeof response === "object" && "data" in response) {
    return response as ApiResponse<T>;
  }
  return { data: (response ?? undefined) as T | undefined };
};

export const userApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // User management
    getUsers: builder.query<ApiResponse<User[]>, UserQueryParams>({
      query: (params) => {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) {
            searchParams.append(key, String(value));
          }
        });
        return `/users?${searchParams.toString()}`;
      },
      providesTags: ["User"],
    }),

    getUser: builder.query<User, string>({
      query: (id) => `/users/${id}`,
      providesTags: (_result, _error, id) => [{ type: "User", id }],
    }),

    // Body is the dynamic user-form payload (UserFormData-shaped, minus confirmPassword).
    // URL is "/users/add" (not "/users") so it matches the CreateUser GraphQL mapping.
    createUser: builder.mutation<ApiResponse<User>, Record<string, unknown>>({
      query: (data) => ({
        url: "/users/add",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["User"],
    }),

    // PATCH (not PUT) so it matches the UpdateUser GraphQL mapping on "/users/:id".
    // Invalidate both the specific user and the list so each refreshes after an edit.
    updateUser: builder.mutation<ApiResponse<User>, { id: string; data: Record<string, unknown> }>({
      query: ({ id, data }) => ({
        url: `/users/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: "User", id }, "User"],
    }),

    deleteUser: builder.mutation<ApiResponse<void>, string>({
      query: (id) => ({
        url: `/users/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["User"],
    }),

    toggleUserStatus: builder.mutation<ApiResponse<User>, { id: string; isActive: boolean }>({
      query: ({ id, isActive }) => ({
        url: `/users/${id}/status`,
        method: "PUT",
        body: { isActive },
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: "User", id }],
    }),

    // ===================================================================
    // User Group
    // ===================================================================

    getUserGroup: builder.query<ApiResponse<UserGroup[]>, UserGroupQueryParams>({
      query: (params) => {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) {
            searchParams.append(key, String(value));
          }
        });
        return `/user_groups/all?${searchParams.toString()}`;
      },
      providesTags: ["UserGroup"],
    }),

    // Group CRUD. Contracts documented in src/core/mocks/userCURL.v2.sh (root: UserGroup).
    // Create/update take UserGroupInsertInput = { active, en, th }; grpId is server-generated.
    createUserGroup: builder.mutation<ApiResponse<UserGroup>, UserGroupCreateData>({
      query: (data) => ({
        url: "/user_groups/add",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["UserGroup"],
    }),

    // PATCH /user_groups/:id — id (the group's grpId) merges into the GraphQL input via pathParams.
    updateUserGroup: builder.mutation<ApiResponse<UserGroup>, { id: string; data: UserGroupUpdateData }>({
      query: ({ id, data }) => ({
        url: `/user_groups/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["UserGroup"],
    }),

    deleteUserGroup: builder.mutation<ApiResponse<void>, string>({
      query: (id) => ({
        url: `/user_groups/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["UserGroup"],
    }),

    // The group's own record plus its member usernames in one call — REST path is /user_groups/{id}
    // (no trailing "/users"), unlike the earlier (wrong) assumption. Powers the group Members view
    // directly; see UserGroupWithMembers.
    getUserGroupById: builder.query<ApiResponse<UserGroupWithMembers>, string>({
      query: (grpId) => `/user_groups/${grpId}`,
      providesTags: ["UserGroup"],
    }),

    // Groups a single user belongs to (GetUserGroupByUsername) — powers the user-side "Groups" tab.
    getUserGroupsByUsername: builder.query<ApiResponse<UserGroupMember[]>, string>({
      query: (username) => `/user_with_groups/username/${username}`,
      providesTags: ["UserGroup"],
    }),

    // Single assign: add one user to one group. grpId -> path/input `id`, username in body.
    assignUserGroup: builder.mutation<ApiResponse<UserGroupMember>, AssignUserGroupData>({
      query: ({ grpId, username }) => ({
        url: `/user_groups/${grpId}/users/add`,
        method: "POST",
        body: { username },
      }),
      invalidatesTags: ["UserGroup"],
    }),

    // Group-centric batch: replace a group's member set. grpId -> path/input `id`.
    assignUserGroupBatch: builder.mutation<ApiResponse<UserGroupMember>, AssignUserGroupBatchData>({
      query: ({ grpId, usernames }) => ({
        url: `/user_groups/${grpId}/users/batch`,
        method: "POST",
        body: { usernames },
      }),
      invalidatesTags: ["UserGroup"],
    }),

    // Remove one membership, keyed by (grpId, username) — both carried in the path.
    deleteAssignUserGroup: builder.mutation<ApiResponse<void>, AssignUserGroupData>({
      query: ({ grpId, username }) => ({
        url: `/user_groups/${grpId}/users/${username}`,
        method: "DELETE",
      }),
      invalidatesTags: ["UserGroup"],
    }),

    // ===================================================================
    // Role
    // ===================================================================

    createUserRoles: builder.mutation<ApiResponse<User>, RoleCreateData>({
      query: (data) => ({
        url: "/role/add",
        method: "POST",
        body: data,
      }),
    }),

    getUserRoles: builder.query<ApiResponse<Role[]>, RoleQueryParams>({
      query: (params) => {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) {
            searchParams.append(key, String(value));
          }
        });
        return `/role?${searchParams.toString()}`;
      }
    }),

    updateUserRoles: builder.mutation<ApiResponse<User>, { id: string; data: RoleUpdateData }>({
      query: ({ id, data }) => ({
        url: `/role/${id}`,
        method: "PATCH",
        body: data,
      }),
    }),

    deleteUserRoles: builder.mutation<ApiResponse<void>, string>({
      query: id => ({
        url: `/role/${id}`,
        method: "DELETE",
      }),
    }),

    // ===================================================================
    // Role and Permission Matching
    // ===================================================================

    // GET api/v1/role_permission
    getUserRolesPermissions: builder.query<ApiResponse<RolePermission[]>, RolePermissionQueryParams>({
      query: (params) => {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) {
            searchParams.append(key, String(value));
          }
        });
        return `/role_permission?${searchParams.toString()}`;
      }
    }),

    // POST api/v1/role_permission/add
    createUserRolePermissions: builder.mutation<ApiResponse<RolePermission[]>, RolePermissionsCreateData>({
      query: (data) => ({
        url: "/role_permission/add",
        method: "POST",
        body: data
      })
    }),

    // PATCH api/v1/role_permission/multi
    updateUserRolesPermissions: builder.mutation<ApiResponse<RolePermission[]>, RolesPermissionsUpdateData>({
      query: (data) => ({
        url: `/role_permission/multi`,
        method: "PATCH",
        body: data
      })
    }),

    // GET api/v1/role_permission/roleId/{roleId}
    getUserRolesPermissionsByRoleId: builder.query<ApiResponse<RolePermission[]>, string>({
      query: (roleId) => `/role_permission/roleId/${roleId}`
    }),

    // GET api/v1/role_permission/{id}
    getUserRolesPermissionsById: builder.query<ApiResponse<RolePermission[]>, number>({
      query: (id) => `/role_permission/${id}`
    }),

    // DELETE api/v1/role_permission/{id}
    deleteUserRolePermissions: builder.mutation<ApiResponse<void>, string>({
      query: (id) => ({
        url: `/role_permission/${id}`,
        method: "DELETE"
      })
    }),

    // PATCH api/v1/role_permission/{roleId}
    updateUserRolePermissions: builder.mutation<ApiResponse<User>, { roleId: string; data: RolePermissionsUpdateData }>({
      query: ({ roleId, data }) => ({
        url: `/role_permission/${roleId}`,
        method: "PATCH",
        body: data
      })
    }),
    
    // ===================================================================
    // Permission
    // ===================================================================

    getUserPermissions: builder.query<ApiResponse<Permission[]>, PermissionQueryParams>({
      query: (params) => {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) {
            searchParams.append(key, String(value));
          }
        });
        return `/permission?${searchParams.toString()}`;
      }
    }),

    // updateUserRole: builder.mutation<ApiResponse<User>, { id: string; role: UserRole }>({
    //   query: ({ id, role }) => ({
    //     url: `/users/${id}/role`,
    //     method: "PUT",
    //     body: { role },
    //   }),
    //   invalidatesTags: (_result, _error, { id }) => [{ type: "User", id }],
    // }),

    updateUserPermissions: builder.mutation<ApiResponse<User>, { id: string; permissions: Permission[] }>({
      query: ({ id, permissions }) => ({
        url: `/users/${id}/permissions`,
        method: "PUT",
        body: { permissions },
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: "User", id }],
    }),

    getUserByUserName: builder.query<ApiResponse<UserProfile>, { username: string }>({
      query: ({ username }) => ({
        url: `/users/username/${username}`,
        method: "GET",
      }),
      transformResponse: (response: unknown) => ensureEnvelope<UserProfile>(response),
    }),

    // ===================================================================
    // Password
    // ===================================================================

    // PATCH /users/change_password/:id -> User.ChangePassword (userCURL.v2.sh:325-339).
    // Self-service: `id` is the caller's own user id. No permission required.
    changePassword: builder.mutation<ApiResponse<unknown>, ChangePasswordData>({
      query: ({ id, ...body }) => ({
        url: `/users/change_password/${id}`,
        method: "PATCH",
        body,
      }),
    }),

    // POST /users/reset_password -> User.ResetPassword (userCURL.v2.sh:341-355).
    // Admin-only: setting another user's password requires the `user.reset_password` permission.
    // Routed through baseApi so the Bearer token is attached — the previous raw-fetch call sent no
    // Authorization header at all, leaving the endpoint unauthenticated.
    resetPassword: builder.mutation<ApiResponse<unknown>, ResetPasswordData>({
      query: (body) => ({
        url: "/users/reset_password",
        method: "POST",
        body,
      }),
    }),

    getUserByUserNameForCaseInfo: builder.query<ApiResponse<UserUnitInfo>, { username: string }>({
      query: ({ username }) => ({
        url: `/users/username/ForCaseInfo/${username}`,
        method: "GET",
      }),
      transformResponse: (response: unknown) => ensureEnvelope<UserUnitInfo>(response),
    }),

    // Bulk operations
    bulkUpdateUsers: builder.mutation<ApiResponse<{ successful: string[]; failed: string[] }>, {
      userIds: string[];
      operation: "activate" | "deactivate" | "role_change" | "department_change";
      data: unknown;
    }>({
      query: (data) => ({
        url: "/users/bulk",
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["User"],
    }),

    // User activity and analytics
    getUserActivity: builder.query<ApiResponse<unknown[]>, {
      userId?: string;
      timeRange: { start: string; end: string };
      page?: number;
      limit?: number;
    }>({
      query: (params) => ({
        url: "/users/activity",
        method: "POST",
        body: params,
      }),
    }),

    // getUserAnalytics: builder.query<ApiResponse<{
    //   totalUsers: number;
    //   activeUsers: number;
    //   newUsers: number;
    //   roleDistribution: Record<UserRole, number>;
    //   departmentDistribution: Record<string, number>;
    // }>, { timeRange: { start: string; end: string } }>({
    //   query: (params) => ({
    //     url: "/users/analytics",
    //     method: "POST",
    //     body: params,
    //   }),
    // }),

    // Department management
    getDepartments: builder.query<ApiResponse<string[]>, void>({
      query: () => "/departments",
    }),

    createDepartment: builder.mutation<ApiResponse<string>, { name: string }>({
      query: (data) => ({
        url: "/users/departments",
        method: "POST",
        body: data,
      }),
    }),

    // User impersonation (admin feature)
    impersonateUser: builder.mutation<ApiResponse<{ token: string; user: User }>, string>({
      query: (userId) => ({
        url: `/users/${userId}/impersonate`,
        method: "POST",
      }),
    }),

    stopImpersonation: builder.mutation<ApiResponse<{ token: string; user: User }>, void>({
      query: () => ({
        url: "/users/stop-impersonation",
        method: "POST",
      }),
    }),

    // ===================================================================
    // Skill
    // ===================================================================

    // Skill
    getSkills: builder.query<ApiResponse<EnhancedSkill[]>, SkillQueryParams>({
      query: (params) => {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) {
            searchParams.append(key, String(value));
          }
        });
        return `/skill?${searchParams.toString()}`;
      },
      // providesTags: ["User"],
    }),

    // Get User Skills by Username
    getUserSkillsByUsername: builder.query<ApiResponse<UserSkill[]>, string>({
      query: (username) => `/users_with_skills/username/${username}`,
      // providesTags: (_result, _error, username) => [{ type: "User", username }],
    }),

    updateUserWithSkillsBatch: builder.mutation<ApiResponse<UserSkill>, UserWithSkillsBatchUpdateData>({
      query: data => ({
        url: `/users_with_skills_batch/add`,
        method: "POST",
        body: data
      })
    }),

    // Get User Area by Username
    getUserAreaByUsername: builder.query<ApiResponse<UserArea[]>, string>({
      query: (username) => `/users_with_area/username/${username}`,
      providesTags: (_result, _error, username) => [{ type: "User", username }],
    }),

    updateUserArea: builder.mutation<ApiResponse<UserArea>, UserAreaUpdateData>({
      query: ({ id, distIds }) => ({
        url: `/users_with_area/${id}`,
        method: "PATCH",
        body: { distIds },
      }),
    }),
  }),
});

export const {
  useGetUsersQuery,
  useGetUserQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useToggleUserStatusMutation,
  useGetUserGroupQuery,
  useCreateUserGroupMutation,
  useUpdateUserGroupMutation,
  useDeleteUserGroupMutation,
  useGetUserGroupByIdQuery,
  useGetUserGroupsByUsernameQuery,
  useAssignUserGroupMutation,
  useAssignUserGroupBatchMutation,
  useDeleteAssignUserGroupMutation,
  useCreateUserRolesMutation,
  useGetUserRolesQuery,
  useGetUserByUserNameForCaseInfoQuery,
  useChangePasswordMutation,
  useResetPasswordMutation,
  useUpdateUserRolesMutation,
  useDeleteUserRolesMutation,
  useGetUserRolesPermissionsQuery,
  useCreateUserRolePermissionsMutation,
  useUpdateUserRolesPermissionsMutation,
  useLazyGetUserRolesPermissionsByRoleIdQuery,
  useGetUserRolesPermissionsByIdQuery,
  useDeleteUserRolePermissionsMutation,
  useUpdateUserRolePermissionsMutation,
  useGetUserPermissionsQuery,
  // useUpdateUserRoleMutation,
  useUpdateUserPermissionsMutation,
  useBulkUpdateUsersMutation,
  useGetUserActivityQuery,
  // useGetUserAnalyticsQuery,
  useGetDepartmentsQuery,
  useCreateDepartmentMutation,
  useImpersonateUserMutation,
  useStopImpersonationMutation,
  useGetUserByUserNameQuery,
  useGetSkillsQuery,
  useGetUserSkillsByUsernameQuery,
  useUpdateUserWithSkillsBatchMutation,
  useGetUserAreaByUsernameQuery,
  useUpdateUserAreaMutation,
} = userApi;
