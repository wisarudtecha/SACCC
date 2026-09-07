// /src/cms/pages/Admin/OrganizationSettingsManagement.tsx
/**
 * @fileoverview Organization/System Settings.
 *
 * @description
 * Thin route wrapper for the permission-gated Organization/System Settings page.
 * The extensible section registry (v1: Map Settings only) and each section's own
 * data fetch / form / save live in the component below.
 */
import React from "react";
import { ProtectedRoute } from "@/core/components/auth/ProtectedRoute";
import { useTranslation } from "@/core/hooks/useTranslation";
import OrganizationSettingsManagementComponent from "@/cms/components/admin/system-configuration/settings/OrganizationSettingsManagement";
import PageBreadcrumb from "@/core/components/common/PageBreadCrumb";
import PageMeta from "@/core/components/common/PageMeta";

const OrganizationSettingsManagementPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <>
      <PageMeta
        title="Organization Settings | Cloud Contact Center"
        description="Organization-level system settings for Cloud Contact Center"
      />

      <ProtectedRoute requiredPermissions={["organization_settings.manage"]}>
        <PageBreadcrumb
          pageTitle={t(
            "navigation.sidebar.main.system_configuration.nested.organization_settings"
          )}
        />

        <OrganizationSettingsManagementComponent />
      </ProtectedRoute>
    </>
  );
};

export default OrganizationSettingsManagementPage;
