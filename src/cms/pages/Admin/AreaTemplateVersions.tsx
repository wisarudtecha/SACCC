// /src/cms/pages/Admin/AreaTemplateVersions.tsx
import React from "react";
import { useParams } from "react-router";
import { ProtectedRoute } from "@/core/components/auth/ProtectedRoute";
import { useTranslation } from "@/core/hooks/useTranslation";
import AreaTemplateVersionsView from "@/cms/components/admin/system-configuration/areaTemplate/AreaTemplateVersionsView";
import PageBreadcrumb from "@/core/components/common/PageBreadCrumb";
import PageMeta from "@/core/components/common/PageMeta";

const AreaTemplateVersionsPage: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();

  return (
    <>
      <PageMeta
        title="Area Template Versions | Cloud Contact Center"
        description="Every version in one area template lineage"
      />

      <ProtectedRoute requiredPermissions={["area.view"]}>
        <PageBreadcrumb pageTitle={t("navigation.sidebar.main.system_configuration.nested.area_template_management")} />

        {id && <AreaTemplateVersionsView templateId={id} />}
      </ProtectedRoute>
    </>
  );
};

export default AreaTemplateVersionsPage;
