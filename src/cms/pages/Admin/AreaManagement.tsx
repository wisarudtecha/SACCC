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
import { useGetCountriesQuery } from "@/cms/store/api/area";
import { useOrgAreaTrees } from "@/cms/hooks/useOrgAreaTrees";
import type { Country } from "@/cms/types/area";
import AreaManagementComponent from "@/cms/components/admin/system-configuration/area/AreaManagement";
import PageBreadcrumb from "@/core/components/common/PageBreadCrumb";
import PageMeta from "@/core/components/common/PageMeta";

const AreaManagementPage: React.FC = () => {
  const { t } = useTranslation();

  // ===================================================================
  // API Data
  // ===================================================================
  // The country list only enumerates which trees to fetch; the hierarchy itself
  // comes from GetOrgCountryTree, already nested. This replaced a
  // length:10000 province + length:20000 district fetch that the browser then
  // re-joined by string-matching provId/countryId.
  const { data: countriesData, isLoading: isLoadingCountries } = useGetCountriesQuery({ start: 0, length: 1000 });
  const countries = countriesData?.data as unknown as Country[] || [];

  const { trees, isLoading: isLoadingTrees, refetch: reloadTrees } = useOrgAreaTrees(countries);

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
          isLoading={isLoadingCountries || isLoadingTrees}
          onReloadTrees={reloadTrees}
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
