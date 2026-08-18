
import React from 'react';
import PageBreadcrumb from "@/core/components/common/PageBreadCrumb";
import PageMeta from "@/core/components/common/PageMeta";
import FormManagerComponent from '@/cms/components/formsManagents/formManagerComponent';
import { useTranslation } from '@/core/hooks/useTranslation';
import { ProtectedRoute } from '@/core/components/auth/ProtectedRoute';

const FormManagentListPage: React.FC = () => {
  const {t}=useTranslation()
  return (
    <>
      <PageMeta
        title="React.js Workflow Management | TailAdmin - Next.js Admin Dashboard Template"
        description="This is React.js Workflow Management page for TailAdmin - React.js Tailwind CSS Admin Dashboard Template"
      />
      
      <PageBreadcrumb pageTitle={t("form_builder.form_management")} />
      <ProtectedRoute requiredPermissions={["form.view"]}>
      <FormManagerComponent/>
      </ProtectedRoute>
    </>
  );
};

export default FormManagentListPage;

