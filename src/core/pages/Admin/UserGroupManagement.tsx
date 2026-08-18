// src/core/pages/Admin/UserGroupManagement.tsx
/**
 * @fileoverview User Group management page.
 *
 * @description
 * Lists user groups (real read from /user_groups/all) and renders the management surface
 * where an admin can create/edit/delete groups and assign member users. Group CRUD and
 * membership persistence are backend-pending (see UserGroupManagement component), so those
 * actions currently operate on local state only.
 */
import React from "react";
import { ProtectedRoute } from "@/core/components/auth/ProtectedRoute";
import { useTranslation } from "@/core/hooks/useTranslation";
import { useGetUserGroupQuery, useGetUsersQuery } from "@/core/store/api/userApi";
import type { UserGroup, UserProfile } from "@/core/types/user";
import PageBreadcrumb from "@/core/components/common/PageBreadCrumb";
import PageMeta from "@/core/components/common/PageMeta";
import UserGroupManagementComponent from "@/core/components/admin/user-management/user-group/UserGroupManagement";

const UserGroupManagementPage: React.FC = () => {
  const { t } = useTranslation();

  // ===================================================================
  // API Data
  // ===================================================================
  const { data: groupsData } = useGetUserGroupQuery({ start: 0, length: 1000 });
  const groups = groupsData?.data as unknown as UserGroup[] || [];

  const { data: usersData } = useGetUsersQuery({ start: 0, length: 100000 });
  const users = usersData?.data as unknown as UserProfile[] || [];

  return groups ? (
    <>
      <PageMeta
        title="React.js User Group Management | TailAdmin - Next.js Admin Dashboard Template"
        description="This is React.js User Group Management page for TailAdmin - React.js Tailwind CSS Admin Dashboard Template"
      />

      <PageBreadcrumb pageTitle={t("navigation.sidebar.main.user_management.nested.user_group")} />

      <ProtectedRoute requiredPermissions={["usergroup.view"]}>
        <UserGroupManagementComponent groups={groups} users={users} />
      </ProtectedRoute>
    </>
  ) : (
    <div>Loading...</div>
  );
};

export default UserGroupManagementPage;
