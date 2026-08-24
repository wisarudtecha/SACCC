// /src/cms/pages/Admin/AreaTemplateDetail.tsx
import React from "react";
import { useParams } from "react-router";
import { ProtectedRoute } from "@/core/components/auth/ProtectedRoute";
import { useTranslation } from "@/core/hooks/useTranslation";
import AreaTemplateDetailView from "@/cms/components/admin/system-configuration/areaTemplate/AreaTemplateDetailView";
import PageBreadcrumb from "@/core/components/common/PageBreadCrumb";
import PageMeta from "@/core/components/common/PageMeta";

const AreaTemplateDetailPage: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();

  return (
    <>
      <PageMeta
        title="Area Template | Cloud Contact Center"
        description="Provinces and districts of one area template version"
      />

      <ProtectedRoute requiredPermissions={["area.view"]}>
        <PageBreadcrumb pageTitle={t("navigation.sidebar.main.system_configuration.nested.area_template_management")} />

        {id && <AreaTemplateDetailView templateId={id} />}
      </ProtectedRoute>
    </>
  );
};

export default AreaTemplateDetailPage;
