// /src/pages/Admin/PropertyManagement.tsx
/**
 * @fileoverview Properties Management Dashboard.
 *
 * @description
 * Property definition management (name/status) for the MDM property list,
 * consumed elsewhere (e.g. service sub-type configuration) as a lookup.
 *
 * @metadata
 * Author: [Wisarud Techa]
 * First Created: [29-08-2025] v0.1.0
 * Last Updated: [19-08-2026] v0.2.0
 */

import React from "react";
import { ProtectedRoute } from "@/core/components/auth/ProtectedRoute";
import { useTranslation } from "@/core/hooks/useTranslation";
import { useGetPropertiesQuery } from "@/cms/store/api/propertyApi";
import type { Property } from "@/cms/types/unit";
import PropertyManagementComponent from "@/cms/components/admin/system-configuration/property/PropertyManagement";
import PageBreadcrumb from "@/core/components/common/PageBreadCrumb";
import PageMeta from "@/core/components/common/PageMeta";

const PropertyManagementPage: React.FC = () => {
  const { t } = useTranslation();

  // ===================================================================
  // API Data
  // ===================================================================
  const { data: propertiesData } = useGetPropertiesQuery({ start: 0, length: 100 });
  const properties = propertiesData?.data as unknown as Property[] || [];

  return (
    <>
      <PageMeta
        title="React.js Property Management | TailAdmin - Next.js Admin Dashboard Template"
        description="This is React.js Property Management page for TailAdmin - React.js Tailwind CSS Admin Dashboard Template"
      />

      <ProtectedRoute requiredPermissions={["unit.view"]}>
        <PageBreadcrumb pageTitle={t("navigation.sidebar.main.system_configuration.nested.property_management")} />

        <PropertyManagementComponent properties={properties} />
      </ProtectedRoute>
    </>
  );
};

export default PropertyManagementPage;
