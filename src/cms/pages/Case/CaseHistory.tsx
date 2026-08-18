// /src/pages/Case/CaseHistory.tsx
/**
 * @fileoverview Code dupplicated from Workflow Management.
 * 
 * @description
 * React TypeScript component for listing case history with navigation functionality.
 * This will include fetching data from an API,
 * displaying case history in a clean list format, and handling click navigation.
 * 
 * @metadata
 * Author: [Wisarud Techa]
 * First Created: [11-07-2025] v0.1.0
 * Last Updated: [15-07-2025] v0.1.1
 * 
 * @notes
 * - Auto-generated code; may contain incomplete logic or require validation.
 * - Modify with caution and document changes.
 * - Intended as a starting point or scaffolding.
 */

import React from "react";
import { ProtectedRoute } from "@/core/components/auth/ProtectedRoute";
import { Area, useGetAreaQuery } from "@/cms/store/api/area";
// import { useGetListCaseQuery } from "@/cms/store/api/caseApi";
import {
  useGetCaseStatusesQuery,
  useGetCaseSubTypesQuery,
  useGetCaseTypesQuery,
  useGetCaseTypesSubTypesQuery
} from "@/cms/store/api/serviceApi";
import { useGetUsersQuery } from "@/core/store/api/userApi";
import type {
  // CaseEntity,
  // CaseHistories,
  CaseStatus,
  CaseTypeSubType,
  EnhancedCaseSubType,
  EnhancedCaseType
} from "@/cms/types/case";
import type { UserProfile } from "@/core/types/user";
import CaseHistoryComponent from "@/cms/components/case/CaseHistory";
// import PageBreadcrumb from "@/core/components/common/PageBreadCrumb";
import PageMeta from "@/core/components/common/PageMeta";

const CaseHistoryPage: React.FC = () => {
  // ===================================================================
  // API Data
  // ===================================================================
  const { data: areasData } = useGetAreaQuery(null);
  const areas = areasData?.data as unknown as Area[] || [];

  // const { data: caseHistoriesData } = useGetListCaseQuery({ start: 0, length: 10 });
  // const caseHistories = caseHistoriesData?.data as unknown as CaseEntity[] || [];

  // const caseHistoriesData = useGetListCaseQuery({ start: 0, length: 10 });
  // const caseHistories = caseHistoriesData as unknown as CaseHistories || {};

  const { data: caseStatusesData } = useGetCaseStatusesQuery({ start: 0, length: 30 });
  const caseStatuses = caseStatusesData?.data as unknown as CaseStatus[] || [];

  const { data: caseSubTypesData } = useGetCaseSubTypesQuery({ start: 0, length: 1000 });
  const caseSubTypes = caseSubTypesData?.data as unknown as EnhancedCaseSubType[] || [];

  const { data: caseTypesData } = useGetCaseTypesQuery({ start: 0, length: 100 });
  const caseTypes = caseTypesData?.data as unknown as EnhancedCaseType[] || [];

  const { data: caseTypesSubTypesData } = useGetCaseTypesSubTypesQuery(null);
  const caseTypesSubTypes = caseTypesSubTypesData?.data as unknown as CaseTypeSubType[] || [];

  const { data: usersData } = useGetUsersQuery({ start: 0, length: 1000 });
  const users = usersData?.data as unknown as UserProfile[] || [];

  const caseStatusesAll = caseStatuses.map(item => item.statusId).join(',');

  return (
    <>
      <PageMeta
        title="React.js Case History | TailAdmin - Next.js Admin Dashboard Template"
        description="This is React.js Case History page for TailAdmin - React.js Tailwind CSS Admin Dashboard Template"
      />

      <ProtectedRoute requiredPermissions={["case.view_history"]}>
        {/* <PageBreadcrumb pageTitle="Case History" /> */}

        <CaseHistoryComponent
          areas={areas}
          // caseHistories={caseHistories}
          caseStatuses={caseStatuses}
          caseStatusesAll={caseStatusesAll}
          caseSubTypes={caseSubTypes}
          caseTypes={caseTypes}
          caseTypesSubTypes={caseTypesSubTypes}
          users={users}
        />
      </ProtectedRoute>
    </>
  );
};

export default CaseHistoryPage;

/**
 * @keyFeatures
 * ----------------------------------------------------------------------------
 * - Dupplicate from /src/pages/Workflow/List.tsx.
 * 
 * @version 0.1.0
 * @date    11-07-2025
 * ----------------------------------------------------------------------------
 * - Component Architecture Strategy.
 * - Custom Preview Dialog Implementation.
 * - Enhanced CRUD Integration.
 * - Interactive Features & User Experience.
 * - State Management Pattern.
 * 
 * @version 0.1.1
 * @date    15-07-2025
 * ----------------------------------------------------------------------------
 */
