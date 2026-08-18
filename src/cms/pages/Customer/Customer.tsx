
import CustomerComponent from '@/cms/components/customer/CustomerComponent';
import PageBreadcrumb from '@/core/components/common/PageBreadCrumb';
import PageMeta from '@/core/components/common/PageMeta';
import { useTranslation } from '@/core/hooks/useTranslation';
import React from 'react';

// import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

const CustomerPage: React.FC = () => {
  const { t } = useTranslation()
  return (
    <div className="  p-5  dark:bg-gray-900 xl:px-10 xl:py-12 min-h-screen">
      <PageMeta
        title="React.js Workflow Management | TailAdmin - Next.js Admin Dashboard Template"
        description="This is React.js Workflow Management page for TailAdmin - React.js Tailwind CSS Admin Dashboard Template"
      />

      <PageBreadcrumb pageTitle={t("navigation.sidebar.main.customer.title")} />
      {/* <ProtectedRoute requiredPermissions={["form.view"]}> */}
      <CustomerComponent />
      {/* </ProtectedRoute> */}
    </div>
  );
};

export default CustomerPage;

