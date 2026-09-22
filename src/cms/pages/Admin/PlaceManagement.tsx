// /src/cms/pages/Admin/PlaceManagement.tsx
/**
 * @fileoverview Place Management Dashboard.
 *
 * @description
 * Admin CRUD for org-curated facilities (Police Station / Hospital / Fire
 * Station) that render as a case-map layer. Route-gated by
 * `organization_settings.manage` (ticket CAD-FE-Case-Map-Place-Device-Layers, Q3).
 *
 * Structurally mirrors PropertyManagement, but the list query lives here so the
 * screen can hand `refetch` down: `placesApi` wires the "Place" cache tag, so a
 * create/update/delete refreshes the list in place with no full-page reload.
 */

import React from "react";
import { ProtectedRoute } from "@/core/components/auth/ProtectedRoute";
import { useTranslation } from "@/core/hooks/useTranslation";
import { useGetPlacesQuery } from "@/cms/store/api/placesApi";
import type { Place } from "@/cms/types/place";
import PlaceManagementComponent from "@/cms/components/admin/system-configuration/place/PlaceManagement";
import PageBreadcrumb from "@/core/components/common/PageBreadCrumb";
import PageMeta from "@/core/components/common/PageMeta";

const PlaceManagementPage: React.FC = () => {
  const { t } = useTranslation();

  // ===================================================================
  // API Data
  // ===================================================================
  const { data: placesData, isLoading, isError, refetch } = useGetPlacesQuery({ start: 0, length: 1000 });
  const places = placesData?.data as unknown as Place[] || [];

  return (
    <>
      <PageMeta
        title="Place Management | Cloud Contact Center"
        description="Admin management of org-curated Place records shown on the case map."
      />

      <ProtectedRoute requiredPermissions={["organization_settings.manage"]}>
        <PageBreadcrumb pageTitle={t("navigation.sidebar.main.system_configuration.nested.place_management")} />

        <PlaceManagementComponent
          places={places}
          isLoading={isLoading}
          isError={isError}
          onRefresh={refetch}
        />
      </ProtectedRoute>
    </>
  );
};

export default PlaceManagementPage;
