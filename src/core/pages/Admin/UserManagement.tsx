// /src/pages/Admin/UserManagement.tsx
/**
 * @fileoverview Code dupplicated from Case History.
 * 
 * @description
 * React TypeScript component for listing users with navigation functionality.
 * This will include fetching data from an API,
 * displaying users in a clean list format, and handling click navigation.
 * 
 * @metadata
 * Author: [Wisarud Techa]
 * First Created: [16-07-2025] v0.1.0
 * Last Updated: [16-07-2025] v0.1.1
 * 
 * @notes
 * - Auto-generated code; may contain incomplete logic or require validation.
 * - Modify with caution and document changes.
 * - Intended as a starting point or scaffolding.
 */

import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { ProtectedRoute } from "@/core/components/auth/ProtectedRoute";
import { useTranslation } from "@/core/hooks/useTranslation";
import { useGetCommandsQuery, useGetDepartmentsQuery, useGetStationsQuery } from "@/core/store/api/organizationApi";
import { useGetSkillQuery } from "@/cms/store/api/skillApi";
import { useOrgAreaTrees } from "@/cms/hooks/useOrgAreaTrees";
import { useGetUsersQuery, useGetUserRolesQuery, useGetUserGroupQuery } from "@/core/store/api/userApi";
import type { Command, Department, Station } from "@/core/types/organization";
import type { Skill } from "@/cms/types/skill";
import type { Role, UserGroup, UserProfile } from "@/core/types/user";
import PageBreadcrumb from "@/core/components/common/PageBreadCrumb";
import PageMeta from "@/core/components/common/PageMeta";
import UserManagementComponent from "@/core/components/admin/user-management/user/UserManagement";
import Toast from "@/core/components/toast/Toast";

const UserManagementPage: React.FC = () => {
  const location = useLocation();
  const { t } = useTranslation();
  
  // Toast state
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  // Check for toast message from navigation state
  useEffect(() => {
    if (location.state?.toast) {
      setToast({
        message: location.state.toast.message,
        type: location.state.toast.type
      });
      
      // Clear the navigation state to prevent toast from showing again on refresh
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [location.state]);

  // ===================================================================
  // API Data
  // ===================================================================

  const { data: usersData } = useGetUsersQuery({ start: 0, length: 100000 });
  const users: UserProfile[] = usersData?.data as unknown as UserProfile[] || [];

  const { data: departmentsData } = useGetDepartmentsQuery({ start: 0, length: 100});
  const departments = departmentsData?.data as unknown as Department[] || [];

  const { data: commandsData } = useGetCommandsQuery({ start: 0, length: 1000});
  const commands = commandsData?.data as unknown as Command[] || [];

  const { data: stationsData } = useGetStationsQuery({ start: 0, length: 10000});
  const stations = stationsData?.data as unknown as Station[] || [];

  const { data: rolesData } = useGetUserRolesQuery({ start: 0, length: 10 });
  const roles = rolesData?.data as unknown as Role[] || [];

  const { data: skillsData } = useGetSkillQuery({ start: 0, length: 100 });
  const skills = skillsData?.data as unknown as Skill[] || [];

  const { data: groupsData } = useGetUserGroupQuery({ start: 0, length: 1000 });
  const groups = groupsData?.data as unknown as UserGroup[] || [];

  // Area assignment reads the org's nested country trees rather than three flat
  // lists it re-joins by provId - a join that mis-grouped districts whenever two
  // countries shared a province code. The hook owns the fetching now, so this
  // page no longer reads the country list itself.
  const { trees } = useOrgAreaTrees();

  return (users && departments && roles) ? (
    <>
      <PageMeta
        title="React.js User Management | TailAdmin - Next.js Admin Dashboard Template"
        description="This is React.js User Management page for TailAdmin - React.js Tailwind CSS Admin Dashboard Template"
      />

      <ProtectedRoute requiredPermissions={["user.view"]}>
        <PageBreadcrumb pageTitle={t("navigation.sidebar.main.user_management.nested.user.header")} />

        <UserManagementComponent usr={users} dept={departments} cmd={commands} stn={stations} role={roles} skill={skills} groups={groups} trees={trees} />
      </ProtectedRoute>

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          duration={3000}
          onClose={() => setToast(null)}
        />
      )}
    </>
  ) : (
    <div>Loading...</div>
  );
};

export default UserManagementPage;

/**
 * @keyFeatures
 * ----------------------------------------------------------------------------
 * - Dupplicate from /src/pages/Case/CaseHistory.tsx
 * 
 * @version 0.1.0
 * @date    16-07-2025
 * ----------------------------------------------------------------------------
 * - Dashboard Metrics.
 * - Advanced Filtering & Search.
 * - User Management Features.
 * - Bulk Operations.
 * - Individual User Actions.
 * 
 * @version 0.1.1
 * @date    16-07-2025
 * ----------------------------------------------------------------------------
 */
