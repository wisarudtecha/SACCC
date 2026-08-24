// /src/cms/pages/Admin/AreaTemplateManagement.tsx
import React from "react";
import { ProtectedRoute } from "@/core/components/auth/ProtectedRoute";
import { useTranslation } from "@/core/hooks/useTranslation";
import AreaTemplateCountryView from "@/cms/components/admin/system-configuration/areaTemplate/AreaTemplateCountryView";
import PageBreadcrumb from "@/core/components/common/PageBreadCrumb";
import PageMeta from "@/core/components/common/PageMeta";

const AreaTemplateManagementPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <>
      <PageMeta
        title="Area Template Management | Cloud Contact Center"
        description="Manage versioned area templates - country, province and district geography with polygon boundaries"
      />

      <ProtectedRoute requiredPermissions={["area.view"]}>
        <PageBreadcrumb pageTitle={t("navigation.sidebar.main.system_configuration.nested.area_template_management")} />

        <AreaTemplateCountryView />
      </ProtectedRoute>
    </>
  );
};

export default AreaTemplateManagementPage;
