// /src/pages/Admin/SkillManagement.tsx
/**
 * @fileoverview Enhanced Skill Management Dashboard.
 * 
 * @description
 * Comprehensive skill management system for CMS with advanced features:
 * - Skill taxonomy management
 * - Proficiency tracking and assessment
 * - Skill gap analysis
 * - Integration with case assignment
 * 
 * @metadata
 * Author: [Wisarud Techa]
 * First Created: [01-09-2025] v0.1.0
 * Last Updated: [01-09-2025] v0.1.0
 * 
 * @notes
 * - Auto-generated code; may contain incomplete logic or require validation.
 * - Modify with caution and document changes.
 * - Intended as a starting point or scaffolding.
 */

import React from "react";
import { ProtectedRoute } from "@/core/components/auth/ProtectedRoute";
import { useTranslation } from "@/core/hooks/useTranslation";
import { useGetSkillQuery } from "@/cms/store/api/skillApi";
import type { Skill } from "@/cms/types/skill";
import SkillManagementComponent from "@/cms/components/admin/system-configuration/skill/SkillManagement";
import PageBreadcrumb from "@/core/components/common/PageBreadCrumb";
import PageMeta from "@/core/components/common/PageMeta";

const SkillManagementPage: React.FC = () => {
  const { t } = useTranslation();

  // ===================================================================
  // API Data
  // ===================================================================
  const { data: skillsData } = useGetSkillQuery({ start: 0, length: 100 });
  const skills = skillsData?.data as unknown as Skill[] || [];

  return (
    <>
      <PageMeta
        title="React.js Skill Management | TailAdmin - Next.js Admin Dashboard Template"
        description="This is React.js Skill Management page for TailAdmin - React.js Tailwind CSS Admin Dashboard Template"
      />

      <ProtectedRoute
        // requiredPermissions={["settings.view"]}
        requiredPermissions={["unit.view"]}
      >
        <PageBreadcrumb pageTitle={t("navigation.sidebar.main.system_configuration.nested.skill_management")} />

        <SkillManagementComponent skills={skills} />
      </ProtectedRoute>
    </>
  );
};

export default SkillManagementPage;

/**
 * @keyFeatures
 * ----------------------------------------------------------------------------
 * - Interactive skill matrix with proficiency levels.
 * - Real-time skill analytics and metrics.
 * - Advanced filtering and search.
 * - Skill assessment workflow integration.
 * - Case assignment skill matching visualization.
 * 
 * @version 0.1.0
 * @date    01-09-2025
 * ----------------------------------------------------------------------------
 */
