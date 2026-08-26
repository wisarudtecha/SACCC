// /src/pages/Admin/AreaManagement.tsx
/**
 * @fileoverview Area Response Management Dashboard.
 *
 * @description
 * Advanced geographic response management system integrating with existing CMS infrastructure.
 * Provides interactive area definition, response analytics, and dynamic unit assignment capabilities.
 *
 * @metadata
 * Author: [Wisarud Techa]
 * First Created: [27-08-2025] v0.1.0
 * Last Updated: [24-08-2026] v0.2.0
 *
 * @notes
 * - Auto-generated code; may contain incomplete logic or require validation.
 * - Modify with caution and document changes.
 * - Intended as a starting point or scaffolding.
 */

import React from "react";
import { ProtectedRoute } from "@/core/components/auth/ProtectedRoute";
import { useTranslation } from "@/core/hooks/useTranslation";
import { useOrgAreaTrees } from "@/cms/hooks/useOrgAreaTrees";
import AreaManagementComponent from "@/cms/components/admin/system-configuration/area/AreaManagement";
import PageBreadcrumb from "@/core/components/common/PageBreadCrumb";
import PageMeta from "@/core/components/common/PageMeta";

const AreaManagementPage: React.FC = () => {
  const { t } = useTranslation();

  // ===================================================================
  // API Data
  // ===================================================================
  // Read directly from the country/province/district list endpoints and join
  // client-side - see useOrgAreaTrees. RTK Query's tag invalidation refetches
  // all three automatically after a write, so there is no manual reload to wire up.
  const { trees, countries, isLoading } = useOrgAreaTrees();

  return (
    <>
      <PageMeta
        title="React.js Area Response Management | TailAdmin - Next.js Admin Dashboard Template"
        description="This is React.js Area Response Management page for TailAdmin - React.js Tailwind CSS Admin Dashboard Template"
      />

      <ProtectedRoute requiredPermissions={["area.view"]}>
        <PageBreadcrumb pageTitle={t("navigation.sidebar.main.system_configuration.nested.area_management")} />

        <AreaManagementComponent
          trees={trees}
          countries={countries}
          isLoading={isLoading}
        />
      </ProtectedRoute>
    </>
  );
};

export default AreaManagementPage;

/**
 * @keyFeatures
 * ----------------------------------------------------------------------------
 * - Dashboard Overview.
 * - Advanced Area Management.
 * - Unit Coverage Matrix.
 *
 * @version 0.2.0
 * @date    24-08-2026
 * ----------------------------------------------------------------------------
 */
