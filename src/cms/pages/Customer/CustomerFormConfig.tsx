

// import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

import CustomerFormConfig from "@/cms/components/customer/CustomerFormConfig";
import PageBreadcrumb from "@/core/components/common/PageBreadCrumb";
import PageMeta from "@/core/components/common/PageMeta";
import { useTranslation } from "@/core/hooks/useTranslation";

const CustomerFormConfigPage: React.FC = () => {
  const { t } = useTranslation()
  return (
    <div className="  p-5  dark:bg-gray-900 xl:px-10 xl:py-12 min-h-screen">

      <PageMeta
        title="React.js Workflow Management | TailAdmin - Next.js Admin Dashboard Template"
        description="This is React.js Workflow Management page for TailAdmin - React.js Tailwind CSS Admin Dashboard Template"
      />

      <PageBreadcrumb pageTitle={t("customerConfigure.pageTitle")} />
      {/* <ProtectedRoute requiredPermissions={["form.view"]}> */}
      <CustomerFormConfig />
      {/* </ProtectedRoute> */}
    </div>
  );
};

export default CustomerFormConfigPage;

