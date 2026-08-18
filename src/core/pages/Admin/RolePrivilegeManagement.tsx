// /src/pages/Admin/RolePrivilegeManagement.tsx
/**
 * @fileoverview Code dupplicated from Case History.
 * 
 * @description
 * React TypeScript component for listing roles with navigation functionality.
 * This will include fetching data from an API,
 * displaying roles in a clean list format, and handling click navigation.
 * 
 * @metadata
 * Author: [Wisarud Techa]
 * First Created: [17-07-2025] v0.1.0
 * Last Updated: [17-07-2025] v0.1.1
 * 
 * @notes
 * - Auto-generated code; may contain incomplete logic or require validation.
 * - Modify with caution and document changes.
 * - Intended as a starting point or scaffolding.
 */

import React from "react";
import { ProtectedRoute } from "@/core/components/auth/ProtectedRoute";
import { useTranslation } from "@/core/hooks/useTranslation";
import {
  useGetUserRolesQuery,
  useGetUserRolesPermissionsQuery,
  useGetUserPermissionsQuery
} from "@/core/store/api/userApi";
import type { Permission, Role, RolePermission } from "@/core/types/role";
import PageBreadcrumb from "@/core/components/common/PageBreadCrumb";
import PageMeta from "@/core/components/common/PageMeta";
import RoleManagementComponent from "@/core/components/admin/user-management/role-privilege/RoleManagement";

const RolePrivilegeManagementPage: React.FC = () => {
  const { t } = useTranslation();

  // ===================================================================
  // API Data
  // ===================================================================
  const { data: permissionsData } = useGetUserPermissionsQuery({ start: 0, length: 1000 });
  const permissions = permissionsData?.data?.filter(p => p.active) as unknown as Permission[] || [];

  const { data: rolesPermissionsData } = useGetUserRolesPermissionsQuery({ start: 0, length: 10000 });
  const rolesPermissions = rolesPermissionsData?.data as unknown as RolePermission[] || [];

  const { data: rolesData } = useGetUserRolesQuery({ start: 0, length: 100 });
  // const roles = rolesData?.data?.map((r) => ({
  //   ...r,
  //   permissions: rolesPermissions.filter(rp => rp.roleId === r.id).map(rp => rp.permId)
  // })) as unknown as Role[] || [];
  const sortOrder = ["system_admin", "admin", "dispatch", "user", "responder", "monitor", "report"];
  const roles = (rolesData?.data?.map((r) => ({
    ...r,
    permissions: rolesPermissions
      .filter((rp) => rp.roleId === r.id)
      .map((rp) => rp.permId),
  }))?.sort((a, b) => {
    const aIndex = sortOrder.indexOf(a.roleName);
    const bIndex = sortOrder.indexOf(b.roleName);
    return (aIndex === -1 ? sortOrder.length : aIndex) - (bIndex === -1 ? sortOrder.length : bIndex);
  })) as unknown as Role[] || [];

  return (permissions && rolesPermissions && roles) ? (
    <>
      <PageMeta
        title="React.js Role Management | TailAdmin - Next.js Admin Dashboard Template"
        description="This is React.js Role Management page for TailAdmin - React.js Tailwind CSS Admin Dashboard Template"
      />

      <PageBreadcrumb pageTitle={t("navigation.sidebar.main.user_management.nested.role_privilege")} />

      <ProtectedRoute requiredPermissions={["role.view"]}>
        <RoleManagementComponent
          role={roles}
          rolesPerms={rolesPermissions}
          perms={permissions}
        />
      </ProtectedRoute>
    </>
  ) : (
    <div>Loading...</div>
  );
};

export default RolePrivilegeManagementPage;

/**
 * @keyFeatures
 * ----------------------------------------------------------------------------
 * - Role Cards View.
 * - Permission Matrix.
 * - Role Hierarchy View.
 * - Comprehensive Metrics.
 * - Advanced Features.
 * 
 * @version 0.1.0
 * @date    17-07-2025
 * ----------------------------------------------------------------------------
 */
