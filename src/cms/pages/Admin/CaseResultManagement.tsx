// /src/cms/pages/Admin/CaseResultManagement.tsx
/**
 * @fileoverview Case Result Management Dashboard.
 *
 * @description
 * Admin CRUD for org-curated close-reason codes (bilingual en/th + active) that
 * populate the "Result" picker in the case close/cancel form
 * (src/cms/components/case/CaseDetailView.tsx). Route-gated by `settings.view`.
 *
 * Structurally mirrors PlaceManagement: the list query lives here so the screen
 * can hand `refetch` down. `caseResultApi` wires the "CaseResult" cache tag, so a
 * create/update/delete refreshes the list in place with no full-page reload.
 */

import React from "react";
import { ProtectedRoute } from "@/core/components/auth/ProtectedRoute";
import { useTranslation } from "@/core/hooks/useTranslation";
import { useGetCaseResultsQuery } from "@/cms/store/api/caseResultApi";
import type { CaseResult } from "@/cms/types/caseResult";
import CaseResultManagementComponent from "@/cms/components/admin/system-configuration/case-result/CaseResultManagement";
import PageBreadcrumb from "@/core/components/common/PageBreadCrumb";
import PageMeta from "@/core/components/common/PageMeta";

const CaseResultManagementPage: React.FC = () => {
  const { t } = useTranslation();

  // ===================================================================
  // API Data
  // ===================================================================
  const { data: caseResultsData, isLoading, isError, refetch } = useGetCaseResultsQuery({ start: 0, length: 100 });
  const caseResults = caseResultsData?.data as unknown as CaseResult[] || [];

  return (
    <>
      <PageMeta
        title="Case Result Management | Cloud Contact Center"
        description="Admin management of the close-reason codes shown when an agent closes or cancels a case."
      />

      <ProtectedRoute requiredPermissions={["settings.view"]}>
        <PageBreadcrumb pageTitle={t("navigation.sidebar.main.system_configuration.nested.case_result_management")} />

        <CaseResultManagementComponent
          caseResults={caseResults}
          isLoading={isLoading}
          isError={isError}
          onRefresh={refetch}
        />
      </ProtectedRoute>
    </>
  );
};

export default CaseResultManagementPage;
