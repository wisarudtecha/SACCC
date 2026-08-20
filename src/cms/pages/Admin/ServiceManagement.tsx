// /src/pages/Admin/ServiceManagement.tsx
/**
 * @fileoverview Advanced Service Type & Sub-Type Management Component.
 * 
 * @description
 * Comprehensive management interface for case types and sub-types with
 * hierarchical organization, advanced configuration, and analytics.
 * Builds upon existing CaseType and CaseSubType interfaces.
 * 
 * @metadata
 * Author: [Wisarud Techa]
 * First Created: [28-08-2025] v0.1.0
 * Last Updated: [28-08-2025] v0.1.0
 * 
 * @notes
 * - Auto-generated code; may contain incomplete logic or require validation.
 * - Modify with caution and document changes.
 * - Intended as a starting point or scaffolding.
 */

import React from "react";
import { ProtectedRoute } from "@/core/components/auth/ProtectedRoute";
import { useTranslation } from "@/core/hooks/useTranslation";
import { useGetSubTypeQuery, useGetTypeQuery } from "@/cms/store/api/caseApi";
import { useGetPropertiesQuery } from "@/cms/store/api/propertyApi";
import { useGetSkillsQuery } from "@/core/store/api/userApi";
import { useGetWorkflowsQuery } from "@/cms/store/api/workflowApi";
import type { EnhancedCaseSubType, EnhancedCaseType } from "@/cms/types/case";
import type { Property } from "@/cms/types/unit";
import type { EnhancedSkill } from "@/core/types/user";
import type { Workflow } from "@/cms/types/workflow";
import ServiceManagementComponent from "@/cms/components/admin/system-configuration/service/ServiceManagement"; 
import PageBreadcrumb from "@/core/components/common/PageBreadCrumb";
import PageMeta from "@/core/components/common/PageMeta";

const CaseManagementPage: React.FC = () => {
  const { t } = useTranslation();

  // ===================================================================
  // API Data
  // ===================================================================
  const { data: caseSubTypesData } = useGetSubTypeQuery(null);
  const caseSubTypes = caseSubTypesData?.data as unknown as EnhancedCaseSubType[] || [];

  const { data: caseTypesData } = useGetTypeQuery(null);
  const caseTypes = caseTypesData?.data as unknown as EnhancedCaseType[] || [];

  const { data: propertiesData } = useGetPropertiesQuery({ start: 0, length: 100 });
  // Only active properties should be selectable from here - this is a lookup for
  // configuring a service sub-type, not the property admin screen, so inactive
  // (retired/disabled) properties are hidden rather than offered as a choice.
  const properties = (propertiesData?.data as unknown as Property[] || []).filter(p => p.active);

  const { data: skillsData } = useGetSkillsQuery({ start: 0, length: 100 });
  const skills = skillsData?.data as unknown as EnhancedSkill[] || [];

  const { data: workflowsData } = useGetWorkflowsQuery({ wfType: "case" });
  const workflows = workflowsData?.data as unknown as Workflow[] || [];

  return (
    <>
      <PageMeta
        title="React.js Service Management | TailAdmin - Next.js Admin Dashboard Template"
        description="This is React.js Service Management page for TailAdmin - React.js Tailwind CSS Admin Dashboard Template"
      />

      <ProtectedRoute requiredPermissions={["service.view"]}>
        <PageBreadcrumb pageTitle={t("navigation.sidebar.main.system_configuration.nested.service_management")} />

        <ServiceManagementComponent
          caseSubTypes={caseSubTypes}
          caseTypes={caseTypes}
          properties={properties}
          skills={skills}
          workflows={workflows}
        />
      </ProtectedRoute>
    </>
  );
};

export default CaseManagementPage;

/**
 * @keyFeatures
 * ----------------------------------------------------------------------------
 * - Hierarchical type builder with drag-and-drop.
 * - Advanced sub-type configuration.
 * - Type analytics and optimization.
 * - Bulk operations.
 * - Template management.
 * - Integration with skills, properties, and workflows.
 * 
 * @version 0.1.0
 * @date    28-08-2025
 * ----------------------------------------------------------------------------
 */
