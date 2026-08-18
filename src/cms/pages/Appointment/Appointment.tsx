

// import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

import Appointment from "@/cms/components/appointment/Appointment";
import PageBreadcrumb from "@/core/components/common/PageBreadCrumb";
import PageMeta from "@/core/components/common/PageMeta";
import { useTranslation } from "@/core/hooks/useTranslation";

const AppointmentPage: React.FC = () => {
  const { t } = useTranslation()
  return (
    <div className="  p-5  dark:bg-gray-900 xl:px-10 xl:py-12 min-h-screen">

      <PageMeta
        title="React.js Workflow Management | TailAdmin - Next.js Admin Dashboard Template"
        description="This is React.js Workflow Management page for TailAdmin - React.js Tailwind CSS Admin Dashboard Template"
      />

      <PageBreadcrumb pageTitle={t("navigation.sidebar.main.appointment.title")} />
      {/* <ProtectedRoute requiredPermissions={["form.view"]}> */}
      <Appointment />
      {/* </ProtectedRoute> */}
    </div>
  );
};

export default AppointmentPage;

